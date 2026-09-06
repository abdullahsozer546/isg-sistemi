import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, CheckCircle, XCircle, ArrowRight, Award } from 'lucide-react';
export default function Training() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isPassed, setIsPassed] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    axios.get(`/api/training/${id}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleAnswerClick = (index) => {
    setSelectedAnswer(index);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === data.quiz[currentQuestionIndex].correctAnswerIndex) {
      setScore(score + 1);
    }

    if (currentQuestionIndex + 1 < data.quiz.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      const finalScore = score + (selectedAnswer === data.quiz[currentQuestionIndex].correctAnswerIndex ? 1 : 0);
      setScore(finalScore);
      setIsPassed(finalScore === data.quiz.length); // Hepsini bilmesi lazım
      setShowResult(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
  };

  const exportPDF = () => {
    window.print();
  };

  if (loading) return <div className="p-10 text-center">Eğitim modülü hazırlanıyor...</div>;
  if (!data) return <div className="p-10 text-center">Eğitim bulunamadı.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {!showQuiz ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6 pb-6 border-b">
            <BookOpen className="w-8 h-8 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Kazadan Çıkarılan Dersler</h1>
          </div>
          <div className="prose prose-slate max-w-none text-lg leading-relaxed mb-8">
            {data.content}
          </div>
          <div className="flex justify-end">
            <button 
              onClick={() => setShowQuiz(true)}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
            >
              <span>Eğitimi Tamamladım, Sınava Geç</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : !showResult ? (
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-6 flex justify-between items-center text-sm font-medium text-slate-500">
            <span>Soru {currentQuestionIndex + 1} / {data.quiz.length}</span>
            <span>{Math.round(((currentQuestionIndex) / data.quiz.length) * 100)}% Tamamlandı</span>
          </div>
          
          <div className="w-full bg-slate-200 rounded-full h-2 mb-8">
            <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${((currentQuestionIndex) / data.quiz.length) * 100}%` }}></div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 mb-6">
            {data.quiz[currentQuestionIndex].questionText}
          </h2>

          <div className="space-y-3">
            {data.quiz[currentQuestionIndex].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedAnswer === index 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                    selectedAnswer === index ? 'border-indigo-600' : 'border-slate-300'
                  }`}>
                    {selectedAnswer === index && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              disabled={selectedAnswer === null}
              onClick={handleNextQuestion}
              className="bg-slate-900 disabled:bg-slate-300 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all"
            >
              {currentQuestionIndex + 1 === data.quiz.length ? 'Sınavı Bitir' : 'Sonraki Soru'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 relative">
          <div className="print:hidden bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
            {isPassed ? (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Tebrikler, Başarıyla Geçtiniz!</h2>
                <p className="text-slate-600 mb-8">Puanınız: {score} / {data.quiz.length}</p>
                <div className="flex space-x-4">
                  <button onClick={() => navigate('/')} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-3 rounded-xl font-bold transition-colors">Ana Sayfaya Dön</button>
                  <button onClick={exportPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md">Sertifikayı İndir (PDF)</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Sınavı Geçemediniz</h2>
                <p className="text-slate-600 mb-4">Puanınız: {score} / {data.quiz.length}. Eğitimi tamamlamak için tüm soruları doğru cevaplamalısınız.</p>
                <button onClick={handleRetry} className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-md">
                  Tekrar Dene
                </button>
              </div>
            )}
          </div>

          {/* Gizli Sertifika Alanı (PDF için render ediliyor) */}
          {isPassed && (
            <div className="hidden print:block absolute top-0 left-0 w-full h-full bg-white z-50">
              <div id="certificate" className="w-full h-full bg-white p-16 flex flex-col justify-center items-center border-[20px] border-indigo-900 relative">
                <div className="absolute top-10 left-10">
                  <Award className="w-24 h-24 text-yellow-500" />
                </div>
                <h1 className="text-6xl font-serif font-bold text-slate-900 mb-6">BAŞARI SERTİFİKASI</h1>
                <p className="text-2xl text-slate-600 mb-10">İş Sağlığı ve Güvenliği Kaza Kök Neden Eğitimi</p>
                
                <div className="w-full max-w-3xl text-center border-t-2 border-b-2 border-slate-200 py-10 mb-10">
                  <p className="text-3xl font-bold text-slate-800 mb-4">Eğitim Modülü Başarıyla Tamamlanmıştır.</p>
                  <p className="text-xl text-slate-500">Sınav Skoru: %100</p>
                </div>

                <div className="flex justify-between w-full px-20">
                  <div className="text-center">
                    <div className="border-b-2 border-slate-400 w-48 mb-2"></div>
                    <p className="text-lg font-bold">Yapay Zeka (AI)</p>
                    <p className="text-sm text-slate-500">İSG Başdenetçisi</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold mb-2">Tarih</p>
                    <p className="text-lg">{new Date().toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

