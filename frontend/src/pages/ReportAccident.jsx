import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bot, Save, Loader2, CheckCircle, Search, ChevronDown } from 'lucide-react';

export default function ReportAccident() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  
  // Custom Searchable Dropdown States
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    employeeId: '',
    department: '',
    machine: '',
    description: '',
    locationPhotoUrl: '',
    rulePhotoUrl: '',
    locationPhotoName: '',
    rulePhotoName: ''
  });
  const [aiResult, setAiResult] = useState(null);

  useEffect(() => {
    axios.get('/api/employees')
      .then(res => setEmployees(res.data))
      .catch(err => console.error("Çalışanlar yüklenemedi", err));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) {
      alert("Lütfen kaza yapan personeli seçin!");
      return;
    }
    setLoading(true);
    
    try {
      const res = await axios.post('/api/accidents', formData);
      setAiResult(res.data.data);
      setLoading(false);
    } catch (error) {
      console.error("Kayıt hatası:", error);
      alert("Kaza kaydedilirken bir hata oluştu.");
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployeeName = employees.find(e => e.id === Number(formData.employeeId))?.name || "Personel Ara / Seç...";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Yeni Kaza Bildirimi</h2>
          <p className="text-sm text-slate-500 mt-1">Kaza detaylarını girin. Sistem kök nedenleri ve riskleri otomatik analiz edecektir.</p>
        </div>
        
        <div className="p-6">
          {!aiResult ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Searchable Custom Dropdown */}
                <div ref={dropdownRef} className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kaza Yapan Personel *</label>
                  <div 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 bg-white flex items-center justify-between cursor-pointer transition-all"
                  >
                    <span className={formData.employeeId ? "text-slate-900" : "text-slate-500"}>
                      {selectedEmployeeName}
                    </span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                      <div className="p-2 border-b border-slate-100 relative">
                        <Search className="w-4 h-4 absolute left-4 top-4 text-slate-400" />
                        <input 
                          type="text"
                          autoFocus
                          placeholder="İsimle ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map(emp => (
                            <div 
                              key={emp.id}
                              onClick={() => {
                                setFormData({...formData, employeeId: emp.id, department: emp.department});
                                setIsDropdownOpen(false);
                                setSearchTerm(''); // reset search after select
                              }}
                              className="px-4 py-2.5 hover:bg-indigo-50 cursor-pointer text-sm flex justify-between items-center transition-colors border-b border-slate-50 last:border-0"
                            >
                              <span className="font-medium text-slate-800">{emp.name}</span>
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{emp.department}</span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-slate-500 text-center">
                            Personel bulunamadı.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kaza Tarihi *</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">İlgili Bölüm *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Örn: Kaynak Atölyesi, Depo..."
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Makine / Ekipman (Varsa)</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Forklift, Pres Makinesi..."
                    value={formData.machine}
                    onChange={(e) => setFormData({...formData, machine: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Kaza Açıklaması *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Kaza nasıl meydana geldi? Detaylı şekilde açıklayın..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                ></textarea>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Kaza Yeri Fotoğrafı (Opsiyonel)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if(file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setFormData({...formData, locationPhotoUrl: reader.result, locationPhotoName: file.name});
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                />
              </div>
            </div>

              <div className="flex justify-end pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>{loading ? 'Sistem Analiz Ediyor...' : 'Kaydet ve Analiz Et'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Kayıt ve Analiz Başarılı</h4>
                  <p className="text-sm mt-1">Kaza başarıyla veritabanına kaydedildi ve Sistem tarafından analiz edildi.</p>
                </div>
              </div>

              {/* Eski Özet Şablon (Geri Getirildi) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center space-x-2 text-indigo-700 mb-4 border-b border-slate-200 pb-3">
                  <Bot className="w-6 h-6" />
                  <h3 className="font-bold text-lg">Sistem Analiz Raporu (Özet)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Kök Neden</span>
                    <p className="mt-1 text-slate-900 font-medium">{aiResult.rootCause}</p>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Seviyesi</span>
                    <span className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      aiResult.riskLevel?.toLowerCase().includes('yüksek') || aiResult.riskLevel?.toLowerCase().includes('kritik')
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {aiResult.riskLevel}
                    </span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Alınması Gereken Önlemler</span>
                    <p className="mt-1 text-slate-900">{aiResult.preventiveMeasures}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Kaza Türü (Eğitim İçin)</span>
                    <p className="mt-1 text-slate-900 capitalize">{aiResult.accidentType}</p>
                  </div>
                </div>
              </div>

              {/* Yeni 5 Neden Resmi Tutanak Formu */}
              <div className="bg-white border-2 border-slate-800 p-8 shadow-sm print:shadow-none print:border-none">
                <h1 className="text-2xl font-bold text-center mb-8 border-b-2 border-slate-800 pb-4">5 Neden Analizi Formu</h1>
                
                <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                  <div>
                    <span className="font-bold">Bölüm / Proses:</span> {formData.department}
                  </div>
                  <div>
                    <span className="font-bold">Tarih:</span> {new Date(formData.date).toLocaleDateString('tr-TR')}
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold">Problem Tanımı:</span> {aiResult.problemDefinition || formData.description}
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold">Risk Seviyesi:</span> 
                    <span className={`ml-2 inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      aiResult.riskLevel?.toLowerCase().includes('yüksek') || aiResult.riskLevel?.toLowerCase().includes('kritik')
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {aiResult.riskLevel}
                    </span>
                  </div>
                </div>

                <div className="mb-8 overflow-x-auto">
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
                      {(aiResult.fiveWhys || []).map((why, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-800 p-2 font-semibold whitespace-nowrap">{why.step}</td>
                          <td className="border border-slate-800 p-2">{why.question}</td>
                          <td className="border border-slate-800 p-2">{why.answer}</td>
                          <td className="border border-slate-800 p-2">{why.evidence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mb-8 text-sm">
                  <span className="font-bold text-red-700">Kök Neden (Root Cause):</span> <span className="font-medium">{aiResult.rootCause}</span>
                </div>

                <div className="mb-8 overflow-x-auto">
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
                      {(aiResult.actions || []).map((action, idx) => (
                        <tr key={idx}>
                          <td className="border border-slate-800 p-2 text-center">{action.no}</td>
                          <td className="border border-slate-800 p-2">{action.action}</td>
                          <td className="border border-slate-800 p-2">{action.responsible}</td>
                          <td className="border border-slate-800 p-2">{action.targetDate}</td>
                          <td className="border border-slate-800 p-2">{action.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {formData.locationPhotoUrl && (
                  <div>
                    <h3 className="font-bold mb-2 text-sm">Görsel:</h3>
                    <img src={formData.locationPhotoUrl} alt="Kaza Yeri" className="max-w-md w-full border border-slate-300 rounded shadow-sm" />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  onClick={() => setAiResult(null)}
                  className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Yeni Kaza Ekle
                </button>
                <button 
                  onClick={() => navigate(`/simulation/${aiResult.id}`)}
                  className="w-full sm:w-auto px-6 py-3 bg-[#1e3a5f] hover:bg-blue-900 text-white rounded-lg font-bold shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  İnteraktif Eğitime Git
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}