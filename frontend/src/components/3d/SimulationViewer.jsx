import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle2, XCircle, ChevronRight, GraduationCap, PlayCircle } from 'lucide-react';

const getLocalImageUrl = (acc, sceneIndex) => {
  const query = ((acc?.accidentType || "") + " " + (acc?.machine || "") + " " + (acc?.description || "")).substring(0, 200);
  return "/api/caricature?q=" + encodeURIComponent(query) + "&index=" + sceneIndex;
};

export default function SimulationViewer({ accidentId, accidentType, isPlaying }) {
  const [trainingData, setTrainingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [sessionSeed] = useState(Math.floor(Math.random() * 100000));

  useEffect(() => {
    if (isPlaying && accidentId && !trainingData && !loading) {
      setLoading(true);
      axios.get('/api/training/' + accidentId)
        .then(res => {
          setTrainingData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Eğitim verisi alınamadı", err);
          setLoading(false);
        });
    }
  }, [isPlaying, accidentId, trainingData]);

  if (!isPlaying) {
    return (
      <div className="text-center z-20 p-8 max-w-md mx-auto mt-20">
        <div className="w-20 h-20 bg-indigo-600/20 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur transition-all border border-indigo-500/30">
          <GraduationCap className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">İnteraktif Eğitim Modülü</h3>
        <p className="text-slate-400 mb-6">Sistemin kazadan çıkardığı dersleri, eğitici görseller üzerinden adım adım yaşayarak öğrenmek için yukarıdaki "Eğitimi Başlat" butonuna tıklayın.</p>
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
           <p className="text-sm text-slate-300">
             <span className="font-semibold text-emerald-400">Not: </span> 
             Görüntüler sistem tarafından o anki kaza anını anlatan eğitici iş güvenliği illüstrasyonları (poster tarzı) olarak canlı olarak çizilir. Gerçek şiddet içermez, eğitim amaçlıdır.
           </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="text-lg">Eğitim Görselleri Hazırlanıyor...</p>
      </div>
    );
  }

  if (!trainingData) {
    return <div className="text-white p-10 text-center">Eğitim senaryosu yüklenemedi.</div>;
  }

  const getScenePrompts = (type, index) => {
    const t = (type || "").toLowerCase();
    
    // Yüksekten düşme
    if (t.includes("düşme") || t.includes("dusme")) {
      if (index === 0) return "construction worker standing unsafely on top of a tall ladder, leaning too far out";
      if (index === 1) return "construction worker falling down from a broken ladder, dangerous accident";
      return "construction worker safely wearing a full body safety harness attached to a secure rope";
    }
    
    // Sıkışma
    if (t.includes("sıkışma") || t.includes("sikisma")) {
      if (index === 0) return "worker's hand too close to heavy industrial machinery gears without safety guards";
      if (index === 1) return "worker's hand getting trapped and crushed in heavy industrial machinery press";
      return "industrial machinery with bright yellow metal safety guards protecting the gears";
    }
    
    // Yangın
    if (t.includes("yangın") || t.includes("yangin")) {
      if (index === 0) return "fire sparks falling near highly flammable chemical barrels";
      if (index === 1) return "huge dangerous fire explosion breaking out in an industrial warehouse";
      return "worker correctly using a red fire extinguisher to put out a fire";
    }
    
    // Elektrik
    if (t.includes("elektrik")) {
      if (index === 0) return "worker touching exposed broken electrical wires with bare hands";
      if (index === 1) return "worker getting a severe electrical shock from a broken machine";
      return "electrician wearing thick rubber safety gloves fixing an electrical box safely";
    }
    
    // Kesici Alet
    if (t.includes("kesilme") || t.includes("kopma")) {
      if (index === 0) return "worker operating a spinning metal saw without a safety blade guard";
      if (index === 1) return "worker's hand getting cut by a sharp spinning metal saw";
      return "worker operating a saw with proper yellow safety guards and cut-resistant steel gloves";
    }
    
    // Generic fallback
    if (index === 0) return "worker performing a dangerous action in a factory without a hard hat";
    if (index === 1) return "industrial accident happening in a factory floor";
    return "worker wearing a hard hat, safety vest, and safety goggles following factory rules";
  };

  if (isCompleted) {
    const acc = trainingData.accident || {};
    const headerTitle = (accidentType || "İSG").toUpperCase() + " KAZASI – EĞİTİM ÖZETİ";
    
    // RENDER EXACT SAME URLS to hit browser cache instantly instead of making AI generate new ones!
    const sceneContextEnd = getScenePrompts(accidentType, 2); // 3. soru (Doğru hareket)
    const uniqueSeedEnd = accidentId.toString() + "2";
    const endImageUrl = getLocalImageUrl(acc, 2);
    
    const sceneContextVis = getScenePrompts(accidentType, 1); // 2. soru (Kaza anı)
    const uniqueSeedVis = accidentId.toString() + "1";
    const visualImageUrl = getLocalImageUrl(acc, 1);

    const handlePrint = () => {
      const printContent = document.getElementById('printable-card-content').innerHTML;
      const printWindow = window.open('', '', 'width=900,height=650');
      printWindow.document.write(`
        <html>
          <head>
            <title>Eğitim Kartı</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="p-8 flex items-center justify-center bg-white">
            <div class="w-full max-w-4xl bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm mx-auto">
              <h3 class="text-xl font-bold text-[#1e3a5f] mb-4 border-b pb-2 uppercase">Eğitim Kartı (Pano / Cep)</h3>
              ${printContent}
            </div>
            <script>
              setTimeout(() => { window.print(); window.close(); }, 1500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    };

    return (
      <div className="w-full h-full bg-white text-slate-900 rounded-lg overflow-y-auto pb-10">
        
        <div className="bg-[#1e3a5f] text-white p-4 text-center font-bold text-2xl tracking-wide uppercase">
          {headerTitle}
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50">
          {/* 1. KAZA AÇIKLAMASI VE ANALİZ */}
          <div className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm">
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-3 border-b pb-2 uppercase tracking-wide">1. Kaza Açıklaması ve Analiz</h3>
            <p className="text-sm text-slate-700 mb-2"><strong>Olay:</strong> {acc.description || "Açıklama bulunamadı."}</p>
            <p className="text-sm text-slate-700 mb-2"><strong>Kök Neden:</strong> {acc.rootCause || "Kök neden bulunamadı."}</p>
            <p className="text-sm text-slate-700"><strong>Alınan Önlem:</strong> {acc.preventiveMeasures || "Önlem bulunamadı."}</p>
          </div>

          {/* 3. Mini Eğitim Senaryosu */}
          <div className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm md:col-start-2 md:row-start-1">
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-3 border-b pb-2 uppercase tracking-wide">3. Mini Eğitim Senaryosu</h3>
            <div className="bg-[#fffbeeb0] p-4 rounded-md border border-[#fde047] mb-4">
              <p className="font-semibold text-slate-800 mb-3 text-sm">{trainingData.quiz[0]?.questionText}</p>
              <ul className="text-sm text-slate-700 space-y-2">
                {trainingData.quiz[0]?.options.map((opt, i) => (
                  <li key={i} className={i === trainingData.quiz[0]?.correctAnswerIndex ? "font-bold text-[#1e3a5f]" : ""}>
                    {String.fromCharCode(65 + i)}: {opt}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 2. GÖRSEL BİLGİLENDİRME ÖNERİLER */}
          <div className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm md:col-start-1 md:row-start-2">
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-3 border-b pb-2 uppercase tracking-wide">2. Görsel Bilgilendirme</h3>
            <div className="w-full flex justify-center">
              <img src={visualImageUrl} className="max-h-64 object-contain rounded-md border border-slate-200 shadow-sm" alt="Görsel Öneri" />
            </div>
          </div>
        </div>

        {/* 4. EĞİTİM KARTI (PANO veya CEP) */}
        <div className="p-4 bg-slate-50">
          <div className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm relative mx-auto w-full md:w-3/4 lg:w-2/3">
            <h3 className="text-lg font-bold text-[#1e3a5f] mb-4 border-b pb-2 uppercase tracking-wide">4. Eğitim Kartı (Pano veya Cep)</h3>
            
            <div id="printable-card-content" className="flex flex-col sm:flex-row border-2 border-[#4eb5e6] rounded-xl overflow-hidden shadow-md bg-white">
              <div className="w-full sm:w-1/3 bg-blue-50/50 flex items-center justify-center p-4 border-b sm:border-b-0 sm:border-r border-[#4eb5e6]">
                <img src={endImageUrl} className="w-full h-48 object-contain drop-shadow-md mix-blend-multiply" alt="Eğitim Görseli" />
              </div>
              <div className="w-full sm:w-2/3 flex flex-col">
                <div className="bg-[#4eb5e6] text-white font-extrabold text-lg p-4 text-center uppercase tracking-wider">
                  {trainingData.quiz[0]?.options[trainingData.quiz[0]?.correctAnswerIndex] || "GÜVENLİK KURALLARINA UY"}
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center text-sm text-slate-800 font-medium leading-relaxed">
                  <ul className="list-disc pl-5 space-y-3">
                    {trainingData.content.split('.').filter(s => s.trim().length > 10).map((sentence, idx) => (
                      <li key={idx} className="leading-snug">{sentence.trim()}.</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-100 flex justify-end space-x-4">
          <button onClick={() => window.location.href = '/'} className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow">
            Ana Sayfaya Dön
          </button>
          <button onClick={handlePrint} className="px-6 py-3 bg-[#1e3a5f] hover:bg-blue-900 text-white rounded-lg font-bold transition-colors shadow flex items-center">
            Eğitim Kartını Yazdır (PDF)
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = trainingData.quiz[currentSceneIndex]; if (!currentQuestion) return <div className="text-white p-10 text-center">Soru yüklenemedi.</div>;


  const sceneContext = getScenePrompts(accidentType, currentSceneIndex);
  
  // Karikatür (Comic) ve Eğitici çizim stili. Kesinlikle yazı olmamasını tembihliyoruz.
  const imagePrompt = encodeURIComponent("Black and white line art drawing, instructional safety comic book style, highly educational safety manual illustration of " + sceneContext + ". Blank signs, empty backgrounds, absolutely no text, no letters, no words, no writing.");
  // Seed'i kaza ID'sine sabitleyerek hem önbellekleme sağlıyoruz hem de farklı kazalarda farklı resimler üretiyoruz.
  const uniqueSeed = accidentId.toString() + currentSceneIndex.toString();
  const imageUrl = getLocalImageUrl(trainingData.accident, currentSceneIndex);

  const handleAnswer = (index) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
    setShowFeedback(true);
  };

  const handleNext = () => {
    if (currentSceneIndex < trainingData.quiz.length - 1) {
      setCurrentSceneIndex(c => c + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <div className="w-full h-full min-h-[600px] bg-slate-900 rounded-lg overflow-hidden relative flex flex-col">
      <div className="flex-1 min-h-[400px] md:min-h-[500px] w-full relative bg-slate-800 flex flex-col items-center justify-start pt-16 p-4 overflow-y-auto">
        <div className="relative w-full max-w-7xl flex flex-col items-center justify-center flex-1 pb-4 min-h-0">
          {/* Eğitici Karikatür Sloganı (ÜSTTE) */}
          <div className="w-full px-6 flex justify-center mb-6">
            <div className="bg-red-600 border-4 border-yellow-400 text-white p-3 rounded-2xl shadow-[0_10px_25px_rgba(220,38,38,0.7)] text-center transform -rotate-1">
              <p className="text-xl md:text-2xl font-black uppercase tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Impact, sans-serif' }}>
                {currentQuestion.slogan || "ÖNCE İŞ GÜVENLİĞİ!"}
              </p>
            </div>
          </div>

          <div className="flex flex-row items-center justify-center gap-6 w-full px-4 flex-1 min-h-0">
            {trainingData.accident?.locationPhotoUrl ? (
              <div className="flex-1 flex justify-center h-full min-h-0">
                <img 
                  src={trainingData.accident.locationPhotoUrl} 
                  alt="Kaza Yeri" 
                  className="w-full h-full object-contain rounded-xl shadow-lg border-2 border-slate-700 bg-white"
                />
              </div>
            ) : <div className="flex-1 hidden md:block"></div>}
            
            <div className="flex-1 flex justify-center h-full min-h-0">
              <img 
                src={imageUrl} 
                alt="Eğitim Görseli" 
                className="w-full h-full object-contain rounded-xl shadow-lg border-2 border-slate-700 bg-white"
                key={imageUrl}
              />
            </div>

            {(currentQuestion.rulePhoto || trainingData.accident?.rulePhotoUrl) ? (
              <div className="flex-1 flex justify-center h-full min-h-0">
                <img 
                  src={currentQuestion.rulePhoto ? `/kurallar/${currentQuestion.rulePhoto}` : trainingData.accident.rulePhotoUrl} 
                  alt="Kural Görseli" 
                  className="w-full h-full object-contain rounded-xl shadow-lg border-2 border-slate-700 bg-white"
                />
              </div>
            ) : <div className="flex-1 hidden md:block"></div>}
          </div>
        </div>
          
        <div className="absolute top-4 left-4 bg-indigo-600/90 text-white px-3 py-1 rounded text-sm font-bold tracking-wider backdrop-blur shadow-lg border border-indigo-500 flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>İNCELEME (SORU {currentSceneIndex + 1}/{trainingData.quiz.length})</span>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col bg-slate-900">
        <h3 className="text-xl font-bold text-white mb-6 border-l-4 border-indigo-500 pl-4">
          {currentQuestion.questionText}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1">
          {currentQuestion.options.map((opt, idx) => {
            const isSelected = selectedAnswer === idx;
            const isCorrect = idx === currentQuestion.correctAnswerIndex;
            
            let btnStyle = "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600";
            
            if (showFeedback) {
              if (isCorrect) {
                btnStyle = "bg-emerald-900/50 border-emerald-500 text-emerald-400";
              } else if (isSelected && !isCorrect) {
                btnStyle = "bg-red-900/50 border-red-500 text-red-400 opacity-50";
              } else {
                btnStyle = "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={showFeedback}
                className={"p-4 rounded-xl border-2 text-left transition-all duration-300 flex items-center justify-between " + btnStyle}
              >
                <span>{opt}</span>
                {showFeedback && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {showFeedback && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-500" />}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end h-12">
          {showFeedback && (
            <button 
              onClick={handleNext}
              className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-colors animate-fade-in-up"
            >
              <span>{currentSceneIndex < trainingData.quiz.length - 1 ? 'Sonraki Sahne' : 'Eğitimi Bitir'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


