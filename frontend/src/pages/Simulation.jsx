import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, RefreshCw, FileText, Maximize } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import SimulationViewer from '../components/3d/SimulationViewer';

export default function Simulation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [accident, setAccident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false); const [showSummary, setShowSummary] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const simulationRef = useRef(null);

  useEffect(() => {
    // Burada kaza detayını çekiyoruz
    axios.get('/api/accidents')
      .then(res => {
        const found = res.data.find(a => a.id === parseInt(id));
        setAccident(found);
        setLoading(false);
      })
      .catch(err => {
        console.error("Hata:", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;
  if (!accident) return <div className="p-10 text-center">Kaza bulunamadı.</div>;

  const exportPDF = () => {
    window.print();
  };

  const handleFullscreen = () => {
    if (simulationRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        simulationRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)] flex flex-col relative">
      <div className="print:hidden space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="font-bold text-lg text-slate-900">İnteraktif Eğitim Soruları</h2>
              <p className="text-sm text-slate-500">Tarih: {new Date(accident.createdAt).toLocaleDateString('tr-TR')} | Bölüm: {accident.department}</p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={exportPDF}
              className="flex items-center space-x-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-300"
            >
              <FileText className="w-4 h-4" />
              <span>Resmi Tutanak (PDF)</span>
            </button>
            <button 
              onClick={handleFullscreen}
              className="flex items-center space-x-1 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Maximize className="w-4 h-4" />
              <span>Tam Ekran</span>
            </button>
            <button 
              onClick={() => setShowLinkModal(true)}
              className="flex items-center space-x-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <span>Çalışan Eğitim Linkini Gönder</span>
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center space-x-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{isPlaying ? 'Duraklat (Önizleme)' : 'Uzman Önizlemesini Başlat'}</span>
            </button>
            <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div ref={simulationRef} className="flex-1 bg-slate-900 rounded-xl overflow-hidden shadow-inner border border-slate-800 relative">
          <SimulationViewer accidentId={accident.id} accidentType={accident.accidentType} isPlaying={isPlaying} />
        
        {/* Overlay Bilgi Paneli */}
        <div className="absolute top-4 right-4 z-50">
          {!showSummary ? (
            <button 
              onClick={() => setShowSummary(true)}
              className="bg-white/95 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-slate-200 font-bold text-slate-800 hover:bg-slate-50 transition-colors"
            >
              Sistem Analiz Özeti
            </button>
          ) : (
            <div className="w-80 max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 custom-scrollbar relative">
              <button 
                onClick={() => setShowSummary(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold"
              >
                Kapat
              </button>
              <h3 className="font-bold text-slate-900 mb-2 border-b pb-2 pr-8">Sistem Analiz Özeti</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-slate-700 block">Kök Neden:</span>
                  <p className="text-slate-600">{accident.rootCause}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block">Önlemler:</span>
                  <p className="text-slate-600">{accident.preventiveMeasures}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Gizli PDF Şablonu (Sadece yazdırma ekranında görünür) */}
      <div id="official-report" className="hidden print:block absolute top-0 left-0 w-full bg-white p-8 z-50">
        
        {/* Eski Şablon (Özet Rapor) */}
        <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">RESMİ KAZA TUTANAĞI (ÖZET)</h1>
            <p className="text-slate-500">İş Sağlığı ve Güvenliği Departmanı</p>
          </div>
          <div className="text-right">
            <p className="font-bold">Tarih: <span className="font-normal">{new Date(accident.createdAt).toLocaleDateString('tr-TR')}</span></p>
            <p className="font-bold">Rapor ID: <span className="font-normal">#{accident.id}</span></p>
          </div>
        </div>
        
        <div className="space-y-6 mb-12">
          <div className="bg-slate-50 p-4 border border-slate-300 rounded">
            <p><strong>Kaza Yapan Personel:</strong> {accident.Employee?.name || 'Bilinmiyor'}</p>
            <p><strong>Bölüm:</strong> {accident.department}</p>
            <p><strong>Makine/Ekipman:</strong> {accident.machine || 'Belirtilmedi'}</p>
            <p><strong>Risk Seviyesi:</strong> {accident.riskLevel}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-2">Olay Açıklaması</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{accident.description}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-2">Sistem Kök Neden Analizi</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{accident.rootCause}</p>
          </div>

          <div>
            <h2 className="text-xl font-bold border-b pb-2 mb-2">Alınması Gereken Önlemler</h2>
            <p className="text-slate-700 whitespace-pre-wrap">{accident.preventiveMeasures}</p>
          </div>
        </div>

        {/* Yeni Şablon (5 Neden Analizi Formu) */}
        <h1 className="text-2xl font-bold text-center mb-6 border-b-2 border-slate-800 pb-4">5 Neden Analizi Detay Formu</h1>
        
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <span className="font-bold">Kaza Yapan Personel:</span> {accident.Employee?.name || 'Bilinmiyor'}
          </div>
          <div>
            <span className="font-bold">Tarih:</span> {new Date(accident.createdAt).toLocaleDateString('tr-TR')}
          </div>
          <div className="col-span-2">
            <span className="font-bold">Bölüm / Proses:</span> {accident.department}
          </div>
          <div className="col-span-2">
            <span className="font-bold">Problem Tanımı:</span> {accident.problemDefinition || accident.description}
          </div>
          <div className="col-span-2">
            <span className="font-bold">Risk Seviyesi:</span> {accident.riskLevel}
          </div>
        </div>

        <div className="mb-6">
          <table className="w-full border-collapse border border-slate-800 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-800 p-2 text-left">Adım</th>
                <th className="border border-slate-800 p-2 text-left">Soru</th>
                <th className="border border-slate-800 p-2 text-left">Cevap (Neden?)</th>
                <th className="border border-slate-800 p-2 text-left">Açıklama / Kanıt</th>
              </tr>
            </thead>
            <tbody>
              {(accident.fiveWhys || []).map((why, idx) => (
                <tr key={idx}>
                  <td className="border border-slate-800 p-2 font-semibold whitespace-nowrap">{why.step}</td>
                  <td className="border border-slate-800 p-2">{why.question}</td>
                  <td className="border border-slate-800 p-2">{why.answer}</td>
                  <td className="border border-slate-800 p-2">{why.evidence}</td>
                </tr>
              ))}
              {(!accident.fiveWhys || accident.fiveWhys.length === 0) && (
                <tr><td colSpan="4" className="border border-slate-800 p-2 text-center text-slate-500">Bu kayıt için detaylı 5 neden analizi bulunmamaktadır.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mb-6 text-sm">
          <span className="font-bold">Kök Neden (Root Cause):</span> {accident.rootCause}
        </div>

        <div className="mb-6">
          <h3 className="font-bold mb-2 text-sm">Alınacak Aksiyonlar / Düzeltici Faaliyetler:</h3>
          <table className="w-full border-collapse border border-slate-800 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-800 p-2 text-center w-12">No</th>
                <th className="border border-slate-800 p-2 text-left">Aksiyon</th>
                <th className="border border-slate-800 p-2 text-left">Sorumlu</th>
                <th className="border border-slate-800 p-2 text-left">Hedef Tarih</th>
                <th className="border border-slate-800 p-2 text-left">Durum</th>
              </tr>
            </thead>
            <tbody>
              {(accident.actions || []).map((action, idx) => (
                <tr key={idx}>
                  <td className="border border-slate-800 p-2 text-center">{action.no}</td>
                  <td className="border border-slate-800 p-2">{action.action}</td>
                  <td className="border border-slate-800 p-2">{action.responsible}</td>
                  <td className="border border-slate-800 p-2">{action.targetDate}</td>
                  <td className="border border-slate-800 p-2">{action.status}</td>
                </tr>
              ))}
              {(!accident.actions || accident.actions.length === 0) && (
                <tr><td colSpan="5" className="border border-slate-800 p-2 text-center text-slate-500">Bu kayıt için detaylı aksiyon listesi bulunmamaktadır.</td></tr>
              )}
            </tbody>
          </table>
          {(!accident.actions || accident.actions.length === 0) && accident.preventiveMeasures && (
            <div className="mt-2 text-sm">
              <span className="font-bold">Özet Önlemler:</span> {accident.preventiveMeasures}
            </div>
          )}
        </div>

        {accident.locationPhotoUrl && (
          <div className="mb-6">
            <h3 className="font-bold mb-2 text-sm">Görsel:</h3>
            <img src={accident.locationPhotoUrl} alt="Kaza Yeri" className="max-h-64 object-contain border border-slate-300 rounded" />
          </div>
        )}

        </div>

      {/* Link Gönderme Paneli Modalı */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Kaza Eğitim Linki Gönderme Paneli</h3>
            <p className="text-slate-500 mb-4 text-sm">Bu linki kopyalayıp personellere gönderdiğinizde, kazaya dair simülasyon ve testi çözebilirler.</p>
            
            <div className="bg-slate-100 p-3 rounded border border-slate-300 font-mono text-sm text-slate-700 break-all mb-4">
              {window.location.origin}/worker-training/{accident.id}
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/worker-training/${accident.id}`);
                  alert('Link kopyalandı!');
                  setShowLinkModal(false);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Kopyala
              </button>
              <button 
                onClick={() => setShowLinkModal(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium py-2 rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
