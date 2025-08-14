import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

const PdfTestPage: React.FC = () => {
    const { bookId } = useParams<{ bookId: string }>();
    const navigate = useNavigate();
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [pdfInfo, setPdfInfo] = useState<any>(null);

    const testPdfUrls = [
        `${process.env.PUBLIC_URL}/books/dummy.pdf`,
        `${process.env.PUBLIC_URL}/books/dummy.pdf`,
        'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf'
    ];

    const testPdfLoad = async (url: string) => {
        setLoading(true);
        setError('');
        
        try {
            console.log('测试PDF URL:', url);
            const loadingTask = pdfjsLib.getDocument({
                url: url,
                disableAutoFetch: true,
                disableStream: true
            });
            
            const pdf = await loadingTask.promise;
            console.log('PDF加载成功:', {
                numPages: pdf.numPages,
                fingerprints: pdf.fingerprints,
                info: await pdf.getMetadata()
            });
            
            setPdfInfo({
                url: url,
                numPages: pdf.numPages,
                fingerprints: pdf.fingerprints
            });
            
            // 测试第一页
            const page = await pdf.getPage(1);
            console.log('第一页加载成功');
            
        } catch (err) {
            console.error('PDF测试失败:', err);
            setError(`PDF测试失败: ${(err as Error).message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>PDF 测试页面</h1>
            <p>测试不同的PDF文件以确定问题所在</p>
            
            <div style={{ marginBottom: '20px' }}>
                <button onClick={() => navigate('/')} style={{ marginRight: '10px' }}>
                    返回首页
                </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
                <h3>测试PDF文件:</h3>
                {testPdfUrls.map((url, index) => (
                    <div key={index} style={{ marginBottom: '10px' }}>
                        <button 
                            onClick={() => testPdfLoad(url)}
                            disabled={loading}
                            style={{ marginRight: '10px' }}
                        >
                            测试PDF {index + 1}
                        </button>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                            {url}
                        </span>
                    </div>
                ))}
            </div>

            {loading && (
                <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                    正在测试PDF...
                </div>
            )}

            {error && (
                <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#ffebee', 
                    color: '#c62828', 
                    borderRadius: '4px',
                    marginTop: '10px'
                }}>
                    <strong>错误:</strong> {error}
                </div>
            )}

            {pdfInfo && (
                <div style={{ 
                    padding: '10px', 
                    backgroundColor: '#e8f5e8', 
                    borderRadius: '4px',
                    marginTop: '10px'
                }}>
                    <h3>PDF信息:</h3>
                    <p><strong>URL:</strong> {pdfInfo.url}</p>
                    <p><strong>页数:</strong> {pdfInfo.numPages}</p>
                    <p><strong>指纹:</strong> {pdfInfo.fingerprints}</p>
                </div>
            )}

            <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <h3>调试信息:</h3>
                <p><strong>当前Book ID:</strong> {bookId}</p>
                <p><strong>PDF.js版本:</strong> {pdfjsLib.version}</p>
                <p><strong>Worker路径:</strong> {pdfjsLib.GlobalWorkerOptions.workerSrc}</p>
            </div>
        </div>
    );
};

export default PdfTestPage;