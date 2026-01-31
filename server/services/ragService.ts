import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFParse } from 'pdf-parse';
import * as mammothLib from 'mammoth';
import fs from 'fs/promises';

async function extractTextFromPDF(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const uint8Array = new Uint8Array(buffer);
  const parser = new PDFParse(uint8Array);
  await parser.load();
  
  const numPages = parser.doc?._pdfInfo?.numPages || 0;
  let fullText = '';
  
  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await parser.doc.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n\n';
    } catch (err) {
      console.error(`Page ${i} extraction error:`, err);
    }
  }
  
  return { text: fullText, numPages };
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }
  
  return chunks;
}

interface DocumentChunk {
  text: string;
  embedding: number[];
  metadata: {
    filename: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

export class RAGService {
  private genAI: GoogleGenerativeAI | null = null;
  private documentChunks: DocumentChunk[] = [];
  private embeddingModel: any = null;
  private chatModel: any = null;
  private isInitialized: boolean = false;

  constructor() {}

  async initialize(apiKey: string): Promise<void> {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'embedding-001' });
    this.chatModel = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });
    this.isInitialized = true;
  }

  async processPDF(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await extractTextFromPDF(dataBuffer);
      
      let text = pdfData.text;
      
      if (pdfData.numPages > 0) {
        text += `\n\n[이 문서는 ${pdfData.numPages}페이지로 구성되어 있습니다.]`;
      }
      
      return text;
    } catch (error) {
      console.error('PDF 처리 오류:', error);
      throw new Error('PDF 파일을 처리할 수 없습니다.');
    }
  }

  async processWord(filePath: string): Promise<string> {
    try {
      const result = await mammothLib.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Word 파일 처리 오류:', error);
      throw new Error('Word 파일을 처리할 수 없습니다.');
    }
  }

  async indexDocument(filePath: string, filename: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RAG 서비스가 초기화되지 않았습니다.');
    }

    let text: string;
    
    if (filename.toLowerCase().endsWith('.pdf')) {
      text = await this.processPDF(filePath);
    } else if (filename.toLowerCase().endsWith('.docx') || filename.toLowerCase().endsWith('.doc')) {
      text = await this.processWord(filePath);
    } else {
      throw new Error('지원하지 않는 파일 형식입니다.');
    }

    const chunks = chunkText(text);
    console.log(`${filename}: ${chunks.length}개의 청크로 분할됨`);

    for (let i = 0; i < chunks.length; i++) {
      let retries = 3;
      let success = false;
      
      while (retries > 0 && !success) {
        try {
          const result = await this.embeddingModel.embedContent(chunks[i]);
          const embedding = result.embedding.values;

          this.documentChunks.push({
            text: chunks[i],
            embedding: embedding,
            metadata: {
              filename,
              chunkIndex: i,
              totalChunks: chunks.length
            }
          });
          success = true;

          // Rate limit delay between successful requests
          if (i < chunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error: any) {
          if (error?.status === 429) {
            console.log(`청크 ${i}: 할당량 초과, ${45}초 대기 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, 45000));
            retries--;
          } else {
            console.error(`청크 ${i} 임베딩 오류:`, error);
            retries = 0;
          }
        }
      }
    }

    console.log(`${filename} 인덱싱 완료: 총 ${this.documentChunks.length}개 청크`);
  }

  async findRelevantChunks(query: string, topK: number = 5): Promise<DocumentChunk[]> {
    if (!this.isInitialized) {
      throw new Error('RAG 서비스가 초기화되지 않았습니다.');
    }

    const result = await this.embeddingModel.embedContent(query);
    const queryEmbedding = result.embedding.values;

    const similarities = this.documentChunks.map(chunk => ({
      chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK)
      .map(item => item.chunk);
  }

  async generateAnswer(question: string): Promise<{
    answer: string;
    sources: Array<{ filename: string; chunkIndex: number }>;
  }> {
    if (!this.isInitialized) {
      throw new Error('RAG 서비스가 초기화되지 않았습니다.');
    }

    if (this.documentChunks.length === 0) {
      return {
        answer: '아직 인덱싱된 매뉴얼이 없습니다. 먼저 매뉴얼을 업로드해주세요.',
        sources: []
      };
    }

    const relevantChunks = await this.findRelevantChunks(question, 5);

    const context = relevantChunks
      .map((chunk, idx) => `[문서 ${idx + 1}: ${chunk.metadata.filename}]\n${chunk.text}`)
      .join('\n\n---\n\n');

    const prompt = `당신은 매뉴얼 문서를 기반으로 질문에 답하는 도우미입니다.

다음은 관련 문서 내용입니다:

${context}

---

위 문서 내용을 바탕으로 다음 질문에 답변해주세요. 문서에 없는 내용은 추측하지 말고, 문서에 있는 정보만 사용하여 답변하세요.

질문: ${question}

답변:`;

    try {
      const result = await this.chatModel.generateContent(prompt);
      const answer = result.response.text();

      return {
        answer,
        sources: relevantChunks.map(chunk => ({
          filename: chunk.metadata.filename,
          chunkIndex: chunk.metadata.chunkIndex
        }))
      };
    } catch (error) {
      console.error('답변 생성 오류:', error);
      throw new Error('답변을 생성할 수 없습니다.');
    }
  }

  getIndexedDocuments(): Array<{ filename: string; chunks: number }> {
    const docMap = new Map<string, number>();
    
    this.documentChunks.forEach(chunk => {
      const filename = chunk.metadata.filename;
      docMap.set(filename, (docMap.get(filename) || 0) + 1);
    });

    return Array.from(docMap.entries()).map(([filename, chunks]) => ({
      filename,
      chunks
    }));
  }

  removeDocument(filename: string): void {
    this.documentChunks = this.documentChunks.filter(
      chunk => chunk.metadata.filename !== filename
    );
  }

  clearAll(): void {
    this.documentChunks = [];
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

export const ragService = new RAGService();
