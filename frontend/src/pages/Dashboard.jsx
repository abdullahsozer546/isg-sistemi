import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldAlert, Users, AlertTriangle, Activity, Search, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentAccidents, setRecentAccidents] = useState([]);
  const [deletePrompt, setDeletePrompt] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const fetchData = () => {
    axios.get('/api/stats').then(res => setStats(res.data)).catch(console.error);
    axios.get('/api/accidents').then(res => {
      setRecentAccidents(res.data);
      setLoading(false);
    }).catch(err => {
      console.error(err); setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteRequest = (id) => {
    setDeletePrompt(id);
  };

  const confirmDelete = async (id) => {
    try {
      await axios.delete(`/api/accidents/${id}`);
      setDeletePrompt(null);
      fetchData(); // Listeyi yenile
    } catch (err) {
      alert("Silme işlemi başarısız oldu.");
    }
  };

  if (loading) return <div className="p-10 text-center">Yükleniyor...</div>;

  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
  const chartData = stats?.departmentStats 
    ? stats.departmentStats.map(item => ({ name: item.department || 'Bilinmiyor', value: parseInt(item.count, 10) })) 
    : [];

  let filteredAndSortedAccidents = recentAccidents.filter(acc => {
    const matchSearch = ((acc.department || '') + ' ' + (acc.machine || '')).toLowerCase().includes(searchTerm.toLowerCase());
    const matchRisk = riskFilter === 'all' || 
                      (riskFilter === 'high' && (acc.riskLevel?.includes('Kritik') || acc.riskLevel?.includes('Yüksek'))) ||
                      (riskFilter === 'low' && (acc.riskLevel?.includes('Orta') || acc.riskLevel?.includes('Düşük')));
    return matchSearch && matchRisk;
  });

  filteredAndSortedAccidents.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.date).getTime();
    const dateB = new Date(b.createdAt || b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">İSG Yönetim Paneli</h1>
        <div className="flex space-x-3">
          <button onClick={() => setShowLinkModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            Temel İSG Eğitimi
          </button>
          <Link to="/report" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm">
            Yeni Kaza Bildir
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Toplam Kaza</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalAccidents || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Kritik Kazalar</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.highRiskAccidents || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Toplam Personel</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalEmployees || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Eğitimsiz Personel</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.untrainedEmployees || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Bölümlere Göre Kazalar</h2>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500">Kaza verisi yok</div>
          )}
        </div>

        {/* Recent Accidents Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Tüm Kaza Kayıtları</h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Bölüm veya Makine Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <select 
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white appearance-none text-sm"
                >
                  <option value="all">Tüm Riskler</option>
                  <option value="high">Kritik / Yüksek Risk</option>
                  <option value="low">Orta / Düşük Risk</option>
                </select>
              </div>
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
              >
                <option value="desc">En Yeni</option>
                <option value="asc">En Eski</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Bölüm / Makine</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Risk Seviyesi</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAndSortedAccidents.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50 relative">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                      {new Date(acc.createdAt || acc.date).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900">{acc.department}</div>
                      <div className="text-xs text-slate-500">{acc.machine || '-'}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        acc.riskLevel?.includes('Kritik') || acc.riskLevel?.includes('Yüksek') 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {acc.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-right space-x-3">
                      {deletePrompt === acc.id ? (
                        <div className="inline-flex items-center space-x-2 bg-red-50 p-1.5 rounded border border-red-100">
                          <span className="text-xs text-red-600 font-normal">Raporlamak (yazdırmak) ister misiniz?</span>
                          <Link to={`/simulation/${acc.id}`} className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700">Evet, İncele</Link>
                          <button onClick={() => confirmDelete(acc.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Hayır, Sil</button>
                          <button onClick={() => setDeletePrompt(null)} className="text-xs text-slate-500 hover:text-slate-700 px-1">İptal</button>
                        </div>
                      ) : (
                        <>
                          <Link to={`/simulation/${acc.id}`} className="text-indigo-600 hover:text-indigo-900">
                            İncele
                          </Link>
                          <button onClick={() => handleDeleteRequest(acc.id)} className="text-red-500 hover:text-red-700">
                            Sil
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredAndSortedAccidents.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                      Arama kriterlerinize uygun kaza kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Link Gönderme Paneli Modalı */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Eğitim Linki Gönderme Paneli</h3>
            <p className="text-slate-500 mb-4 text-sm">Bu linki kopyalayıp personellere gönderdiğinizde, sisteme giriş yapıp temel İSG eğitimlerini alabilirler.</p>
            
            <div className="bg-slate-100 p-3 rounded border border-slate-300 font-mono text-sm text-slate-700 break-all mb-4">
              {window.location.origin}/basic-training
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/basic-training`);
                  alert('Link kopyalandı!');
                  setShowLinkModal(false);
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors"
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
