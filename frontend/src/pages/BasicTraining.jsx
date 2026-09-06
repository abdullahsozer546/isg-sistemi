import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Heart, ShieldCheck, AlertCircle, ChevronRight, CheckCircle2, User, ArrowLeft } from 'lucide-react';

export default function BasicTraining() {
  const [trainingData, setTrainingData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States: 'login', 'intro', 'briefing', 'quiz', 'failed', 'success'
  const [stage, setStage] = useState('login');
  const [briefingParts, setBriefingParts] = useState([]);
  const [currentBriefingIndex, setCurrentBriefingIndex] = useState(0);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lives, setLives] = useState(2);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  // Login states
  const [empId, setEmpId] = useState('');
  const [empName, setEmpName] = useState('');
  const [loginError, setLoginError] = useState('');
  const [verifiedEmployee, setVerifiedEmployee] = useState(null);

  useEffect(() => {
    axios.get(`/api/basic-training`)
      .then(res => {
        setTrainingData(res.data);
        
        // Metni paragraflara böl ve boş olanları temizle
        const parts = res.data.content.split('\n').filter(p => p.trim().length > 10);
        setBriefingParts(parts);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await axios.get(`/api/employees/${empId}`);
      if (res.data && res.data.name.toLocaleLowerCase('tr-TR').trim() === empName.toLocaleLowerCase('tr-TR').trim()) {
        setVerifiedEmployee(res.data);
        setStage('intro');
      } else {
        setLoginError('Ad veya ID eşleşmiyor.');
      }
    } catch (err) {
      setLoginError('Personel bulunamadı. ID nizi kontrol edin.');
    }
  };

  const startBriefing = () => {
    setStage('briefing');
    setCurrentBriefingIndex(0);
  };

  const nextBriefing = () => {
    if (currentBriefingIndex < briefingParts.length - 1) {
      setCurrentBriefingIndex(prev => prev + 1);
    } else {
      setStage('quiz');
      setCurrentQuestionIndex(0);
      setLives(2);
    }
  };

  const handleAnswer = (idx, isCorrect) => {
    if (showFeedback) return;
    setSelectedAnswer(idx);
    setShowFeedback(true);

    setTimeout(() => {
      if (isCorrect) {
        if (currentQuestionIndex < trainingData.quiz.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
          setShowFeedback(false);
        } else {
          finishTrainingSuccess();
        }
      } else {
        const newLives = lives - 1;
        setLives(newLives);
        if (newLives <= 0) {
          finishTrainingFail();
        } else {
          // Canı var, aynı soruyu tekrar denesin
          setSelectedAnswer(null);
          setShowFeedback(false);
        }
      }
    }, 1500);
  };

  const finishTrainingSuccess = () => {
    setStage('success');
    if (verifiedEmployee) {
      axios.put(`/api/employees/${verifiedEmployee.id}`, { hasTraining: true, trainingStatus: 'Eğitim Aldı', lastTrainingDate: new Date().toISOString() })
        .catch(err => console.error("Eğitim durumu güncellenemedi", err));
    }
  };

  const finishTrainingFail = () => {
    setStage('failed');
    setShowFeedback(false);
    setSelectedAnswer(null);
    if (verifiedEmployee) {
      axios.put(`/api/employees/${verifiedEmployee.id}`, { trainingStatus: 'Eğitim Almadı' })
        .catch(err => console.error("Eğitim durumu güncellenemedi", err));
    }
  };

  const restartTraining = () => {
    setStage('briefing');
    setCurrentBriefingIndex(0);
    setCurrentQuestionIndex(0);
    setLives(2);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const goBack = () => {
    if (stage === 'intro') {
      setStage('login');
      setVerifiedEmployee(null);
    } else if (stage === 'briefing') {
      if (currentBriefingIndex > 0) {
        setCurrentBriefingIndex(prev => prev - 1);
      } else {
        setStage('intro');
      }
    } else if (stage === 'quiz') {
      if (currentQuestionIndex > 0) {
        // Can't easily go back a question without refunding lives or unanswering. But we can just go back to previous question if we want, but it's complex. Let's just go back to briefing
        setStage('briefing');
        setCurrentBriefingIndex(briefingParts.length - 1);
        setCurrentQuestionIndex(0); // Reset quiz
        setLives(2);
      } else {
        setStage('briefing');
        setCurrentBriefingIndex(briefingParts.length - 1);
      }
    } else if (stage === 'failed') {
      setStage('login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
        <p className="text-xl">Eğitim modülü yükleniyor...</p>
      </div>
    );
  }

  if (!trainingData) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <p className="text-xl text-red-500">Eğitim verisi bulunamadı.</p>
      </div>
    );
  }

  const getImageUrl = (sceneIndex) => {
    return `/api/caricature?q=genel&index=${sceneIndex}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Üst Bar */}
      <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center space-x-4">
          {stage !== 'login' && stage !== 'success' && (
            <button onClick={goBack} className="flex items-center space-x-1 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-bold hidden md:inline">Geri</span>
            </button>
          )}
          <div className="flex items-center space-x-2 text-indigo-400">
            <ShieldCheck className="w-6 h-6" />
            <span className="font-bold text-lg tracking-wide uppercase">İSG Eğitim Terminali</span>
          </div>
        </div>
        {verifiedEmployee && (
          <div className="hidden md:flex items-center space-x-2 text-slate-400">
            <User className="w-4 h-4" />
            <span>{verifiedEmployee.name}</span>
          </div>
        )}
        {stage === 'quiz' && (
          <div className="flex items-center space-x-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
            <span className="text-sm text-slate-400 mr-2">Hata Toleransı:</span>
            {[...Array(2)].map((_, i) => (
              <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-red-500' : 'text-slate-700'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        {stage === 'login' && (
          <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-indigo-900/50 rounded-full flex items-center justify-center border border-indigo-500/30 mb-4">
                <ShieldCheck className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Eğitim Portalı Girişi</h2>
              <p className="text-slate-400 text-center mt-2">Eğitim kaydınızın işlenmesi için lütfen kimliğinizi doğrulayın.</p>
            </div>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Ad Soyad</label>
                <input 
                  type="text" 
                  required
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 mb-4"
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Personel ID (Sicil No)</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  value={empId}
                  onChange={e => setEmpId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Örn: 1"
                />
              </div>
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg mt-4 transition-colors"
              >
                Giriş Yap
              </button>
            </form>
          </div>
        )}

        {stage === 'intro' && (
          <div className="max-w-2xl text-center space-y-6">
            <div className="w-24 h-24 bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto border border-indigo-500/30">
              <AlertCircle className="w-12 h-12 text-indigo-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">Güvenlik Brifingi</h1>
            <p className="text-lg text-slate-400">
              Hoş geldin, <span className="font-bold text-white">{verifiedEmployee?.name}</span>. Birazdan inceleyeceğiniz kaza ve alınması gereken önlemler, sizin ve çalışma arkadaşlarınızın sağlığını korumak içindir. Lütfen dikkatlice okuyunuz.
            </p>
            <button 
              onClick={startBriefing}
              className="mt-8 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-lg transition-all shadow-lg hover:shadow-indigo-500/25"
            >
              Brifingi Başlat
            </button>
          </div>
        )}

        {stage === 'briefing' && (
          <div className="w-full max-w-3xl flex flex-col items-center">
            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden mb-8 border-2 border-slate-700 shadow-2xl relative">
              <img 
                src={getImageUrl(currentBriefingIndex)} 
                alt="Brifing Görseli" 
                className="w-full h-full object-contain opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
            </div>

            <div className="bg-slate-800 p-6 md:p-8 rounded-xl border border-slate-700 shadow-xl w-full text-center relative -mt-20 z-10">
              <p className="text-xl md:text-2xl text-slate-200 leading-relaxed font-medium">
                "{briefingParts[currentBriefingIndex]}"
              </p>
              
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={nextBriefing}
                  className="flex items-center space-x-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all"
                >
                  <span>{currentBriefingIndex < briefingParts.length - 1 ? 'Devam Et' : 'Teste Geç'}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex space-x-2">
              {briefingParts.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentBriefingIndex ? 'w-8 bg-indigo-500' : 'w-4 bg-slate-700'}`}></div>
              ))}
            </div>
          </div>
        )}

        {stage === 'quiz' && (
          <div className="w-full max-w-4xl flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
            {/* Soru Görseli */}
            <div className="flex-1 bg-black rounded-xl border border-slate-700 overflow-hidden flex items-center justify-center p-4">
              <img 
                src={trainingData.quiz[currentQuestionIndex].rulePhoto ? `/kurallar/${trainingData.quiz[currentQuestionIndex].rulePhoto}` : getImageUrl(currentQuestionIndex + 10)}
                alt="Kural"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Soru ve Şıklar */}
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <div className="text-indigo-400 font-bold mb-2 uppercase text-sm tracking-wider">Soru {currentQuestionIndex + 1} / {trainingData.quiz.length}</div>
                <h2 className="text-xl font-bold text-white leading-snug">
                  {trainingData.quiz[currentQuestionIndex].questionText}
                </h2>
              </div>

              <div className="space-y-3">
                {trainingData.quiz[currentQuestionIndex].options.map((opt, idx) => {
                  const isCorrect = idx === trainingData.quiz[currentQuestionIndex].correctAnswerIndex;
                  const isSelected = selectedAnswer === idx;
                  
                  let btnStyle = "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500 text-slate-300";
                  
                  if (showFeedback) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-900/50 border-emerald-500 text-emerald-400";
                    } else if (isSelected) {
                      btnStyle = "bg-red-900/50 border-red-500 text-red-400 opacity-50";
                    } else {
                      btnStyle = "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx, isCorrect)}
                      disabled={showFeedback}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 font-medium ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {stage === 'failed' && (
          <div className="max-w-xl text-center space-y-6 bg-slate-800 p-10 rounded-2xl border border-red-900/50 shadow-2xl">
            <div className="w-24 h-24 bg-red-900/30 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-white">Eğitim İhlali</h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Hatalı seçimler yaptınız. Unutmayın, iş güvenliği kuralları sizin ve mesai arkadaşlarınızın sağlığını korumak için vardır. Konuyu daha iyi pekiştirmek için bilgileri tekrar gözden geçirmeliyiz.
            </p>
            <button 
              onClick={restartTraining}
              className="mt-4 px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-all border border-slate-500"
            >
              Brifingi Tekrar Başlat
            </button>
          </div>
        )}

        {stage === 'success' && (
          <div className="max-w-xl text-center space-y-6 bg-slate-800 p-10 rounded-2xl border border-emerald-900/50 shadow-2xl">
            <div className="w-24 h-24 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-white">EĞİTİM TAMAMLANDI</h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Güvenli çalışma prosedürlerini başarıyla kavradınız. Eğitim kaydınız sisteme işlenmiştir. Güvenliğiniz için teşekkür ederiz.
            </p>
            <div className="mt-8 p-4 bg-slate-900 rounded-lg border border-slate-700 inline-block text-left">
              <p className="text-sm text-slate-500 uppercase tracking-wide">Sertifika ID / İzin Belgesi</p>
              <p className="font-mono text-indigo-400">{Math.random().toString(36).substring(2, 10).toUpperCase()}-ISG-{new Date().getFullYear()}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
