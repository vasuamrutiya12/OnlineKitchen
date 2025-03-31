import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  UtensilsCrossed,
  Camera,
  Bell,
  User,
  Search,
  Book,
  TrendingUp
} from 'lucide-react';
import DashboardView from './views/DashboardView';
import InventoryView from './views/InventoryView';
import OrdersView from './views/OrdersView';
import AIMenuView from './views/AIMenuView';
import FoodAnalysisView from './views/FoodAnalysisView';
import RecipeView from './views/RecipeView';
import SalesAndDemandView from './views/SalesAndDemandView';

function Sidebar({ activeView, setActiveView }: { activeView: string; setActiveView: (view: string) => void }) {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Package, label: 'Inventory', id: 'inventory' },
    { icon: ClipboardList, label: 'Orders', id: 'orders' },
    { icon: Book, label: 'Recipes', id: 'recipes' },
    { icon: UtensilsCrossed, label: 'AI Menu', id: 'ai-menu' },
    { icon: Camera, label: 'Food Analysis', id: 'food-analysis' },
    { icon: TrendingUp, label: 'Sales & Demand', id: 'sales-demand' },
  ];

  return (
    <div className="w-64 bg-indigo-800 text-white h-screen fixed left-0 top-0">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-8">MMV Admin</h1>
        <nav>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg mb-2 transition-colors ${
                activeView === item.id
                  ? 'bg-indigo-700' 
                  : 'hover:bg-indigo-700/50'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6 fixed top-0 right-0 left-64">
      <div className="flex items-center space-x-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-full">
          <Bell size={20} />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg">
          <User size={20} />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
}

function App() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'inventory':
        return <InventoryView />;
      case 'orders':
        return <OrdersView />;
      case 'recipes':
        return <RecipeView />;
      case 'ai-menu':
        return <AIMenuView />;
      case 'food-analysis':
        return <FoodAnalysisView />;
      case 'sales-demand':
        return <SalesAndDemandView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex bg-gray-50">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6 mt-16">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;