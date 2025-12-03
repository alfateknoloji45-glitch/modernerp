import React, { useState, useEffect } from 'react';
import { Search, Plus, Trash2, PenTool, Box, ArrowRight, CheckCircle, AlertTriangle } from 'lucide-react';

const Production = () => {
  const [products, setProducts] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState('produce'); // 'produce' (Üretim) veya 'recipes' (Reçeteler)
  
  // Yeni Reçete Formu
  const [newRecipe, setNewRecipe] = useState({ name: '', targetProductId: '', ingredients: [] });
  const [ingredientInput, setIngredientInput] = useState({ productId: '', quantity: '' });

  // Üretim Formu
  const [production, setProduction] = useState({ recipeId: '', quantity: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const storedProducts = await window.db.get('products') || [];
    const storedRecipes = await window.db.get('recipes') || [];
    setProducts(storedProducts);
    setRecipes(storedRecipes);
  };

  // --- REÇETE OLUŞTURMA ---
  const addIngredient = () => {
    if (!ingredientInput.productId || !ingredientInput.quantity) return;
    const product = products.find(p => p.id === Number(ingredientInput.productId));
    setNewRecipe({
        ...newRecipe,
        ingredients: [...newRecipe.ingredients, { id: product.id, name: product.name, quantity: Number(ingredientInput.quantity) }]
    });
    setIngredientInput({ productId: '', quantity: '' });
  };

  const saveRecipe = async () => {
    if (!newRecipe.name || !newRecipe.targetProductId || newRecipe.ingredients.length === 0) return alert("Bilgileri eksiksiz doldurun!");
    
    const recipeToAdd = { id: Date.now(), ...newRecipe };
    const updatedRecipes = [...recipes, recipeToAdd];
    await window.db.set('recipes', updatedRecipes);
    setRecipes(updatedRecipes);
    setNewRecipe({ name: '', targetProductId: '', ingredients: [] });
    alert("Reçete kaydedildi!");
  };

  const deleteRecipe = async (id) => {
      if(confirm("Reçeteyi silmek istiyor musun?")) {
          const updated = recipes.filter(r => r.id !== id);
          setRecipes(updated);
          await window.db.set('recipes', updated);
      }
  };

  // --- ÜRETİM YAP (SİHİRLİ KISIM) ---
  const handleProduce = async () => {
    if (!production.recipeId || !production.quantity) return alert("Reçete ve miktar seçin!");
    
    const qty = Number(production.quantity);
    const recipe = recipes.find(r => r.id === Number(production.recipeId));
    
    // 1. Hammadde Yeterli mi Kontrol Et
    let canProduce = true;
    recipe.ingredients.forEach(ing => {
        const stockItem = products.find(p => p.id === ing.id);
        if (!stockItem || stockItem.stock < (ing.quantity * qty)) {
            alert(`Yetersiz Stok: ${ing.name}`);
            canProduce = false;
        }
    });
    if (!canProduce) return;

    // 2. Hammaddeleri Stoktan Düş
    let updatedProducts = [...products];
    recipe.ingredients.forEach(ing => {
        updatedProducts = updatedProducts.map(p => {
            if (p.id === ing.id) return { ...p, stock: p.stock - (ing.quantity * qty) };
            return p;
        });
    });

    // 3. Üretilen Malı Stoğa Ekle
    updatedProducts = updatedProducts.map(p => {
        if (p.id === Number(recipe.targetProductId)) return { ...p, stock: p.stock + qty };
        return p;
    });

    // 4. Kaydet
    await window.db.set('products', updatedProducts);
    setProducts(updatedProducts);
    
    // Log Kaydı (İsteğe bağlı eklenebilir)
    
    alert(`${qty} adet ${recipe.name} başarıyla üretildi!`);
    setProduction({ recipeId: '', quantity: '' });
  };

  return (
    <div className="p-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Üretim Yönetimi</h2>
            <p className="text-gray-500 text-sm">Reçete tanımlama ve imalat</p>
        </div>
        
        {/* SEKMELER */}
        <div className="bg-white border p-1 rounded-lg flex">
            <button 
                onClick={() => setActiveTab('produce')} 
                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${activeTab === 'produce' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
            >
                <PenTool size={16}/> Üretim Yap
            </button>
            <button 
                onClick={() => setActiveTab('recipes')} 
                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 ${activeTab === 'recipes' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500'}`}
            >
                <Box size={16}/> Reçeteler
            </button>
        </div>
      </div>

      {/* --- EKRAN 1: ÜRETİM EKRANI --- */}
      {activeTab === 'produce' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Üretim Formu */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-indigo-700">
                      <PenTool/> İmalat Emri
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-gray-500 block mb-1">REÇETE SEÇİN</label>
                          <select className="w-full p-3 border rounded-lg bg-gray-50" value={production.recipeId} onChange={e => setProduction({...production, recipeId: e.target.value})}>
                              <option value="">Seçiniz...</option>
                              {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold text-gray-500 block mb-1">ÜRETİLECEK MİKTAR</label>
                          <input type="number" className="w-full p-3 border rounded-lg text-lg font-bold" placeholder="0" value={production.quantity} onChange={e => setProduction({...production, quantity: e.target.value})}/>
                      </div>

                      {production.recipeId && (
                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                              <p className="text-xs font-bold text-indigo-800 mb-2">KULLANILACAK HAMMADDELER:</p>
                              {recipes.find(r => r.id === Number(production.recipeId))?.ingredients.map((ing, i) => (
                                  <div key={i} className="flex justify-between text-sm text-indigo-600 mb-1">
                                      <span>{ing.name}</span>
                                      <span className="font-bold">{(ing.quantity * (Number(production.quantity) || 0))} Adet/Birim</span>
                                  </div>
                              ))}
                          </div>
                      )}

                      <button onClick={handleProduce} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                          <CheckCircle/> ÜRETİMİ TAMAMLA
                      </button>
                  </div>
              </div>

              {/* Bilgi Paneli */}
              <div className="flex flex-col gap-4">
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                      <h4 className="font-bold text-blue-800 mb-2">Nasıl Çalışır?</h4>
                      <p className="text-sm text-blue-600">
                          1. Soldan bir reçete seçin.<br/>
                          2. Kaç adet üreteceğinizi girin.<br/>
                          3. Hammaddeler stoğunuzdan otomatik düşer.<br/>
                          4. Ürettiğiniz ürün stoğunuza eklenir.
                      </p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                      <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Stok Uyarısı</h4>
                      <p className="text-sm text-orange-600">
                          Eğer hammaddelerden herhangi biri stokta yetersizse üretim gerçekleşmez. Lütfen önce hammadde alımı yapın.
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* --- EKRAN 2: REÇETE TANIMLAMA --- */}
      {activeTab === 'recipes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Reçete Listesi */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-4 border-b bg-gray-50 font-bold text-gray-600">Kayıtlı Reçeteler</div>
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                      {recipes.map(recipe => (
                          <div key={recipe.id} className="p-4 hover:bg-gray-50 relative group">
                              <button onClick={() => deleteRecipe(recipe.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                              <h4 className="font-bold text-gray-800">{recipe.name}</h4>
                              <div className="mt-2 text-sm text-gray-500">
                                  {recipe.ingredients.map(ing => `${ing.name} (${ing.quantity})`).join(', ')}
                              </div>
                          </div>
                      ))}
                      {recipes.length === 0 && <p className="p-8 text-center text-gray-400">Henüz reçete yok.</p>}
                  </div>
              </div>

              {/* Yeni Reçete Formu */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-fit">
                  <h3 className="font-bold text-lg mb-4 text-gray-800">Yeni Reçete Oluştur</h3>
                  <div className="space-y-4">
                      <input placeholder="Reçete Adı (Örn: Çilekli Pasta)" className="w-full p-2 border rounded" value={newRecipe.name} onChange={e => setNewRecipe({...newRecipe, name: e.target.value})}/>
                      
                      <div>
                          <label className="text-xs font-bold text-gray-500">ÜRETİLECEK ÜRÜN (Çıktı)</label>
                          <select className="w-full p-2 border rounded mt-1" value={newRecipe.targetProductId} onChange={e => setNewRecipe({...newRecipe, targetProductId: e.target.value})}>
                              <option value="">Seçiniz...</option>
                              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <label className="text-xs font-bold text-gray-500 mb-2 block">İÇİNDEKİLER (Hammadde Ekle)</label>
                          <div className="flex gap-2 mb-2">
                              <select className="flex-1 p-2 border rounded text-sm" value={ingredientInput.productId} onChange={e => setIngredientInput({...ingredientInput, productId: e.target.value})}>
                                  <option value="">Hammadde Seç...</option>
                                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                              </select>
                              <input type="number" placeholder="Miktar" className="w-20 p-2 border rounded text-sm" value={ingredientInput.quantity} onChange={e => setIngredientInput({...ingredientInput, quantity: e.target.value})}/>
                              <button onClick={addIngredient} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"><Plus size={18}/></button>
                          </div>
                          
                          {/* Eklenenler Listesi */}
                          <div className="space-y-1">
                              {newRecipe.ingredients.map((ing, idx) => (
                                  <div key={idx} className="flex justify-between text-sm bg-white p-2 border rounded">
                                      <span>{ing.name}</span>
                                      <span className="font-bold">{ing.quantity} Birim</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <button onClick={saveRecipe} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Reçeteyi Kaydet</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Production;