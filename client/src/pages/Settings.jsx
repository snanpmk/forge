import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Settings as SettingsIcon, Plus, X, Save, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function Settings() {
    const { user, loadUser } = useAuth();
    const [incomeCats, setIncomeCats] = useState([]);
    const [expenseCats, setExpenseCats] = useState([]);
    const [newIncome, setNewIncome] = useState('');
    const [newExpense, setNewExpense] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user?.finance_settings?.categories) {
            setIncomeCats(user.finance_settings.categories.income || []);
            setExpenseCats(user.finance_settings.categories.expense || []);
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await api.put('/user/settings', {
                finance_settings: {
                    categories: {
                        income: incomeCats,
                        expense: expenseCats
                    }
                }
            });
            await loadUser(); // Refresh user context
            toast.success('Settings saved successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const addCategory = (type) => {
        if (type === 'income') {
            if (newIncome && !incomeCats.includes(newIncome)) {
                setIncomeCats([...incomeCats, newIncome]);
                setNewIncome('');
            }
        } else {
            if (newExpense && !expenseCats.includes(newExpense)) {
                setExpenseCats([...expenseCats, newExpense]);
                setNewExpense('');
            }
        }
    };

    const removeCategory = (type, cat) => {
        if (type === 'income') {
            setIncomeCats(incomeCats.filter(c => c !== cat));
        } else {
            setExpenseCats(expenseCats.filter(c => c !== cat));
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10 animate-fade-in">
             <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-gray-100 rounded-2xl">
                  <SettingsIcon size={28} className="text-gray-700" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
                  <p className="text-gray-500 text-sm font-medium">Manage your preferences and customization.</p>
                </div>
            </div>

            <div className="card p-6 shadow-soft space-y-8">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                        <h2 className="text-xl font-bold">Finance Categories</h2>
                        <p className="text-sm text-gray-500">Customize the dropdown options for your transactions.</p>
                    </div>
                    <Button onClick={handleSave} disabled={loading} className="gap-2">
                        <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Income Categories */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-green-600 flex items-center gap-2">
                            Income Categories <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{incomeCats.length}</span>
                        </h3>
                        
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                className="input-field text-sm"
                                placeholder="Add new income category..."
                                value={newIncome}
                                onChange={e => setNewIncome(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addCategory('income')}
                            />
                            <button 
                                onClick={() => addCategory('income')}
                                className="p-2 bg-gray-100 rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {incomeCats.map(cat => (
                                <div key={cat} className="group flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 transition-all">
                                    {cat}
                                    <button 
                                        onClick={() => removeCategory('income', cat)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Expense Categories */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-red-600 flex items-center gap-2">
                            Expense Categories <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{expenseCats.length}</span>
                        </h3>
                        
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                className="input-field text-sm"
                                placeholder="Add new expense category..."
                                value={newExpense}
                                onChange={e => setNewExpense(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addCategory('expense')}
                            />
                            <button 
                                onClick={() => addCategory('expense')}
                                className="p-2 bg-gray-100 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {expenseCats.map(cat => (
                                <div key={cat} className="group flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-300 transition-all">
                                    {cat}
                                    <button 
                                        onClick={() => removeCategory('expense', cat)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 text-blue-800 p-4 rounded-xl flex items-start gap-3 text-sm">
                    <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    <p>Tip: Removing a category will not delete past transactions with that category, but it will no longer appear in the dropdown for new entries.</p>
                </div>
            </div>
        </div>
    );
}
