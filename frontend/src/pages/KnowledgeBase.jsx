import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

export default function KnowledgeBase() {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setStatus('error');
      setMessage('Lütfen sadece PDF dosyası yükleyin.');
      return;
    }
    setFile(selectedFile);
    setStatus('idle');
    setMessage('');
    setDetails(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setMessage('PDF okunuyor ve yapay zeka vektörlerine dönüştürülüyor. Bu işlem dosya boyutuna göre birkaç saniye sürebilir...');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/knowledge/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setStatus('success');
      setMessage(res.data.message);
      setDetails({
        total: res.data.totalChunks,
        success: res.data.successfulChunks
      });
      setFile(null);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage(error.response?.data?.error || 'Yükleme sırasında bir hata oluştu.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center space-x-3 mb-6 border-b pb-4">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">İSG Mevzuat ve Kurallar Merkezi</h1>
            <p className="text-slate-500 text-sm mt-1">İSG mevzuatlarını, şirket kurallarını ve PDF dokümanlarını buraya yükleyerek yapay zekayı eğitin.</p>
          </div>
        </div>

        <div 
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`p-4 rounded-full ${file ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
              <UploadCloud className="w-8 h-8" />
            </div>
            
            {file ? (
              <div className="space-y-1">
                <p className="text-lg font-bold text-slate-700">{file.name}</p>
                <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button 
                  onClick={() => setFile(null)}
                  className="text-red-500 text-sm hover:underline mt-2"
                >
                  Farklı bir dosya seç
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-lg font-medium text-slate-700">PDF dosyasını buraya sürükleyin</p>
                <p className="text-sm text-slate-500">veya</p>
                <button 
                  onClick={() => fileInputRef.current.click()}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Bilgisayardan Seçin
                </button>
              </div>
            )}
          </div>
        </div>

        {file && status !== 'uploading' && status !== 'success' && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleUpload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center space-x-2 shadow-sm"
            >
              <UploadCloud className="w-5 h-5" />
              <span>Sistemi Eğit (Pinecone'a Yükle)</span>
            </button>
          </div>
        )}

        {status === 'uploading' && (
          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl flex items-center space-x-4">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <div>
              <p className="font-bold text-blue-900">Yükleniyor ve İşleniyor...</p>
              <p className="text-sm text-blue-700">{message}</p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6 p-6 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-4">
            <CheckCircle className="w-8 h-8 text-emerald-600 mt-1" />
            <div>
              <p className="font-bold text-emerald-900">Başarılı!</p>
              <p className="text-emerald-700">{message}</p>
              {details && (
                <div className="mt-2 text-sm text-emerald-800 bg-emerald-100 p-3 rounded-lg inline-block">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Toplam Çıkarılan Parça (Chunk): {details.total}</li>
                    <li>Vektör Veritabanına (Pinecone) Başarıyla Yüklenen: {details.success}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="font-bold text-red-900">Hata!</p>
              <p className="text-sm text-red-700">{message}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
