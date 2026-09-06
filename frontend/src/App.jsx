import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Home, PlusCircle, Users, Database } from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import ReportAccident from './pages/ReportAccident';
import Simulation from './pages/Simulation';
import Training from './pages/Training';
import Employees from './pages/Employees';
import WorkerTraining from './pages/WorkerTraining';
import BasicTraining from './pages/BasicTraining';
import KnowledgeBase from './pages/KnowledgeBase';

function AppContent() {
  const location = useLocation();
  const isWorkerTraining = location.pathname.startsWith('/worker-training') || location.pathname.startsWith('/basic-training');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar - Sadece uzman/admin ekranlarında görünür */}
      {!isWorkerTraining && (
        <nav className="bg-slate-900 text-white shadow-lg print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <ShieldAlert className="h-8 w-8 text-red-500" />
                <span className="font-bold text-xl tracking-tight">İSG Yönetim Sistemi</span>
              </div>
              <div className="flex space-x-4">
                <Link to="/" className="flex items-center space-x-1 hover:text-red-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">
                  <Home className="h-4 w-4" />
                  <span>Ana Sayfa</span>
                </Link>
                <Link to="/employees" className="flex items-center space-x-1 hover:text-red-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">
                  <Users className="h-4 w-4" />
                  <span>Personel Listesi</span>
                </Link>
                <Link to="/knowledge-base" className="flex items-center space-x-1 hover:text-red-400 transition-colors px-3 py-2 rounded-md text-sm font-medium">
                  <Database className="h-4 w-4" />
                  <span>Bilgi Bankası</span>
                </Link>
                <Link to="/report" className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 transition-colors px-4 py-2 rounded-md text-sm font-bold text-white shadow-sm">
                  <PlusCircle className="h-4 w-4" />
                  <span>Yeni Kaza Bildir</span>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full ${!isWorkerTraining ? 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8' : ''}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/report" element={<ReportAccident />} />
            <Route path="/simulation/:id" element={<Simulation />} />
            <Route path="/training/:id" element={<Training />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/worker-training/:accidentId" element={<WorkerTraining />} />
            <Route path="/basic-training" element={<BasicTraining />} />
            <Route path="/knowledge-base" element={<KnowledgeBase />} />
          </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
