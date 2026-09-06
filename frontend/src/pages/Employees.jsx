import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, UserPlus, CheckCircle, XCircle, Search, Filter, FileSpreadsheet, FileText, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    hasTraining: false,
    lastTrainingDate: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [trainingFilter, setTrainingFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('asc');

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showExcelInfo, setShowExcelInfo] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = () => {
    axios.get('/api/employees')
      .then(res => {
        setEmployees(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('/api/employees', formData)
      .then(res => {
        setEmployees([{...res.data, Accidents: []}, ...employees]);
        setShowAddForm(false);
        setFormData({ name: '', department: '', hasTraining: false, lastTrainingDate: '' });
      })
      .catch(err => alert('Hata oluştu'));
  };

  const handleEditClick = (emp) => {
    setEditingId(emp.id);
    setEditFormData(emp);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    axios.put('/api/employees/' + editingId, editFormData)
      .then(res => {
        setEmployees(employees.map(emp => emp.id === editingId ? {...res.data, Accidents: emp.Accidents} : emp));
        setEditingId(null);
      })
      .catch(err => alert('Güncelleme hatası'));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const mappedData = data.map(row => {
          let hasTraining = false;
          if (row['Eğitim Durumu']) {
            hasTraining = row['Eğitim Durumu'].toString().toLowerCase().trim() === 'evet';
          }
          return {
            name: row['Ad Soyad'] || row['Ad'] || 'İsimsiz',
            department: row['Departman'] || row['Bölüm'] || 'Belirtilmedi',
            hasTraining: hasTraining,
            lastTrainingDate: row['Son Eğitim Tarihi'] ? new Date(row['Son Eğitim Tarihi']) : null
          };
        });

        axios.post('/api/employees/bulk', mappedData)
          .then(res => {
            alert(res.data.length + " personel başarıyla eklendi!");
            fetchEmployees();
            setShowExcelInfo(false);
          })
          .catch(err => alert('Toplu ekleme sırasında hata oluştu.'));
      } catch (error) {
        alert("Dosya okunamadı. Lütfen geçerli bir Excel dosyası yükleyin.");
      }
      e.target.value = null; // reset
    };
    reader.readAsBinaryString(file);
  };

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  const filteredAndSortedEmployees = employees
    .filter(emp => {
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
      let matchesTraining = true;
      if (trainingFilter === 'trained') {
        matchesTraining = emp.hasTraining === true;
      } else if (trainingFilter === 'missing') {
        matchesTraining = emp.hasTraining === false;
      }
      return matchesSearch && matchesTraining;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name, 'tr');
      } else if (sortOrder === 'desc') {
        return b.name.localeCompare(a.name, 'tr');
      } else if (sortOrder === 'accidents_desc') {
        const countA = a.Accidents ? a.Accidents.length : 0;
        const countB = b.Accidents ? b.Accidents.length : 0;
        return countB - countA;
      } else if (sortOrder === 'accidents_asc') {
        const countA = a.Accidents ? a.Accidents.length : 0;
        const countB = b.Accidents ? b.Accidents.length : 0;
        return countA - countB;
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>Personel ve Eğitim Yönetimi</span>
          </h1>
          <p className="text-slate-500 mt-1">İşçilerin İSG eğitim durumlarını ve kaza geçmişlerini takip edin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowExcelInfo(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Excel'den Yükle</span>
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <UserPlus className="w-5 h-5" />
            <span>Yeni Personel Ekle</span>
          </button>
        </div>
      </div>

      {showExcelInfo && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-xl relative">
          <button onClick={() => setShowExcelInfo(false)} className="absolute top-4 right-4 text-emerald-600 hover:text-emerald-800"><XCircle className="w-5 h-5" /></button>
          <h3 className="font-bold text-emerald-900 text-lg flex items-center"><FileText className="w-5 h-5 mr-2"/> Excel ile Personel Ekleme Formatı</h3>
          <p className="text-emerald-800 mt-2 text-sm">Sisteme toplu personel eklemek için Excel dosyanızın ilk satırında (başlık) tam olarak şu sütunlar olmalıdır:</p>
          <ul className="list-disc ml-5 mt-2 text-sm text-emerald-800 font-medium">
            <li>Ad Soyad</li>
            <li>Departman</li>
            <li>Eğitim Durumu <span className="font-normal text-xs">(Sadece "Evet" veya "Hayır" yazın)</span></li>
            <li>Son Eğitim Tarihi <span className="font-normal text-xs">(Örn: 2026-08-20, Opsiyonel)</span></li>
          </ul>
          <div className="mt-4">
            <input 
              type="file" 
              accept=".xlsx, .xls, .csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current.click()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
              Dosya Seç ve Yükle
            </button>
          </div>
        </div>
      )}

      {/* Arama ve Filtreleme */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full relative">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Personel Ara (İsim ile)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <select 
              value={trainingFilter}
              onChange={(e) => setTrainingFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border rounded-lg appearance-none bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="trained">Eğitimi Tamamlananlar</option>
              <option value="missing">Eğitimi Eksik Olanlar</option>
            </select>
          </div>
          <select 
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="asc">A'dan Z'ye</option>
            <option value="desc">Z'den A'ya</option>
            <option value="accidents_desc">En Çok Kaza Yapanlar</option>
            <option value="accidents_asc">En Az Kaza Yapanlar</option>
          </select>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
          <h2 className="text-lg font-bold mb-4">Yeni Personel Kaydı</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Departman</label>
              <input 
                required
                type="text" 
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center space-x-2 mt-6">
              <input 
                type="checkbox" 
                id="training"
                checked={formData.hasTraining}
                onChange={e => setFormData({...formData, hasTraining: e.target.checked})}
                className="w-5 h-5 text-indigo-600"
              />
              <label htmlFor="training" className="text-sm font-medium text-slate-700">Temel İSG Eğitimi Aldı mı?</label>
            </div>
            {formData.hasTraining && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Eğitim Tarihi ve Saati</label>
                <input 
                  type="datetime-local" 
                  value={formData.lastTrainingDate ? formData.lastTrainingDate.substring(0, 16) : ''}
                  onChange={e => setFormData({...formData, lastTrainingDate: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            )}
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium">Kaydet</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ad Soyad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Departman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Eğitim Durumu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Kaza</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredAndSortedEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  {editingId === emp.id ? (
                    <td colSpan="6" className="px-6 py-4">
                      <form onSubmit={handleEditSubmit} className="flex flex-wrap gap-4 items-center">
                        <input 
                          type="text" 
                          value={editFormData.name} 
                          onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                          className="border px-2 py-1 rounded" 
                          required
                        />
                        <input 
                          type="text" 
                          value={editFormData.department} 
                          onChange={e => setEditFormData({...editFormData, department: e.target.value})} 
                          className="border px-2 py-1 rounded" 
                          required
                        />
                        <label className="flex items-center space-x-1">
                          <input 
                            type="checkbox" 
                            checked={editFormData.hasTraining} 
                            onChange={e => setEditFormData({...editFormData, hasTraining: e.target.checked})} 
                          />
                          <span className="text-sm">Eğitimli</span>
                        </label>
                        {editFormData.hasTraining && (
                          <input 
                            type="datetime-local" 
                            value={editFormData.lastTrainingDate ? editFormData.lastTrainingDate.substring(0, 16) : ''} 
                            onChange={e => setEditFormData({...editFormData, lastTrainingDate: e.target.value})} 
                            className="border px-2 py-1 rounded" 
                          />
                        )}
                        <div className="flex space-x-2 ml-auto">
                          <button type="submit" className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700">Kaydet</button>
                          <button type="button" onClick={() => setEditingId(null)} className="bg-slate-300 text-slate-700 px-3 py-1 rounded text-sm hover:bg-slate-400">İptal</button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono">#{emp.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{emp.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-600">{emp.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {emp.hasTraining ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-4 h-4 mr-1" /> Eğitim Aldı
                          </span>
                        ) : (
                          emp.trainingStatus === 'Eğitim Almadı' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <XCircle className="w-4 h-4 mr-1" /> Eğitim Almadı
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                              <XCircle className="w-4 h-4 mr-1" /> Eğitimsiz
                            </span>
                          )
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {emp.Accidents && emp.Accidents.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 font-bold">
                            {emp.Accidents.length} Kaza
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">Yok</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                        <button onClick={() => setSelectedEmployee(emp)} className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                          <Info className="w-4 h-4 mr-1"/> İncele
                        </button>
                        <button onClick={() => handleEditClick(emp)} className="text-indigo-600 hover:text-indigo-900 inline-flex">Düzenle</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <Users className="w-6 h-6 mr-2 text-indigo-600"/> Personel Detayları
              </h2>
              <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Ad Soyad</p>
                  <p className="font-semibold text-slate-900 text-lg">{selectedEmployee.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Departman</p>
                  <p className="font-semibold text-slate-900 text-lg">{selectedEmployee.department}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Eğitim Durumu</p>
                  <p className="font-semibold text-slate-900 flex items-center mt-1">
                    {selectedEmployee.hasTraining ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Eğitim Aldı</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Eğitim Almadı</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Son Eğitim Tarihi</p>
                  <p className="font-semibold text-slate-900">
                    {selectedEmployee.hasTraining && selectedEmployee.lastTrainingDate 
                      ? new Date(selectedEmployee.lastTrainingDate).toLocaleDateString('tr-TR') 
                      : 'Kayıt Yok'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 text-lg mb-3 flex items-center">
                  <span className="bg-red-100 text-red-600 p-1.5 rounded-lg mr-2">
                    <Info className="w-5 h-5"/>
                  </span>
                  Kaza Geçmişi ({selectedEmployee.Accidents ? selectedEmployee.Accidents.length : 0})
                </h3>
                
                {selectedEmployee.Accidents && selectedEmployee.Accidents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedEmployee.Accidents.map((acc, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:border-red-300 transition-colors bg-white shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-800">
                            {new Date(acc.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            acc.riskLevel === 'Yüksek' ? 'bg-red-100 text-red-800' :
                            acc.riskLevel === 'Orta' ? 'bg-amber-100 text-amber-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {acc.riskLevel || 'Bilinmiyor'} Risk
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1"><strong>Makine:</strong> {acc.machine || 'Belirtilmedi'}</p>
                        <p className="text-sm text-slate-600"><strong>Açıklama:</strong> {acc.description}</p>
                        <p className="text-sm text-slate-600 mt-2 p-2 bg-slate-50 rounded italic border-l-2 border-indigo-400">
                          <strong>Kök Neden:</strong> {acc.rootCause}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center justify-center border border-emerald-200">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Bu personelin kayıtlı kaza geçmişi bulunmamaktadır.
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end bg-slate-50 sticky bottom-0">
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors"
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
