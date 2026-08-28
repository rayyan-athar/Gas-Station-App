import { useEffect, useState, useMemo } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct } from "../api";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [form, setForm] = useState({ 
    name: "", 
    quantity: 0, 
    price: 0,
    category: "", 
    shelf_location: "",
  });
  const [bulk, setBulk] = useState({ pricePercent: 0, category: "" });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [restockForm, setRestockForm] = useState({ id: null, quantity: 0 });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setProducts(await getProducts());
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleRestockChange(e) {
    setRestockForm({ ...restockForm, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    const payload = {
      name: form.name,
      quantity: Number(form.quantity) || 0,
      price: Number(form.price) || 0,
      category: form.category || "",
      shelf_location: form.shelf_location || ""
    };
    if (editingId) {
      await updateProduct(editingId, payload);
      setEditingId(null);
    } else {
      await addProduct(payload);
    }
    setForm({ name: "", quantity: 0, price: 0, category: "", shelf_location: "" });
    setShowForm(false);
    load();
  }

  function edit(product) {
    setForm({
      name: product.name,
      quantity: product.quantity,
      price: product.price,
      category: product.category || "",
      shelf_location: product.shelf_location || ""
    });
    setEditingId(product.product_id);
    setShowForm(true);
  }

  function cancelEdit() {
    setForm({ name: "", quantity: 0, price: 0, category: "", shelf_location: "" });
    setEditingId(null);
    setShowForm(false);
  }

  async function handleBulkUpdate() {
    if (selectedProducts.length === 0) return;
    const updatesById = new Map();
    const selected = products.filter(p => selectedProducts.includes(p.product_id));
    selected.forEach(p => {
      const upd = {};
      if (bulk.category.trim()) upd.category = bulk.category.trim();
      if (!isNaN(Number(bulk.pricePercent)) && Number(bulk.pricePercent) !== 0) {
        const factor = 1 + (Number(bulk.pricePercent) / 100);
        upd.price = Number((Number(p.price || 0) * factor).toFixed(2));
      }
      if (Object.keys(upd).length > 0) updatesById.set(p.product_id, upd);
    });
    await Promise.all(Array.from(updatesById.entries()).map(([id, upd]) => updateProduct(id, upd)));
    setBulk({ pricePercent: 0, category: "" });
    load();
  }

  async function remove(id) {
    if (window.confirm("Delete this product?")) {
      await deleteProduct(id);
      load();
    }
  }

  async function restock(e) {
    e.preventDefault();
    if (restockForm.id && restockForm.quantity > 0) {
      const product = products.find(p => p.product_id === parseInt(restockForm.id));
      const newQty = product.quantity + parseInt(restockForm.quantity);
      await updateProduct(restockForm.id, { quantity: newQty });
      setRestockForm({ id: null, quantity: 0 });
      load();
    }
  }

  function handleSelectProduct(id) {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  function handleSelectAllProducts() {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.product_id));
    }
  }

  async function handleBulkDelete() {
    if (window.confirm(`Delete ${selectedProducts.length} products?`)) {
      await Promise.all(selectedProducts.map(id => deleteProduct(id)));
      setSelectedProducts([]);
      load();
    }
  }

  function exportToCSV() {
    const headers = ['ID', 'Name', 'Quantity', 'Price', 'Category', 'Location'];
    const rows = filteredProducts.map(p => [
      p.product_id,
      p.name,
      p.quantity,
      p.price,
      p.category || '',
      p.shelf_location || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products.csv';
    a.click();
  }

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.shelf_location?.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== 'all') {
      result = result.filter(p => p.category === filterCategory);
    }

    if (filterStock === 'low') {
      result = result.filter(p => p.quantity > 0 && p.quantity <= 10);
    } else if (filterStock === 'out') {
      result = result.filter(p => p.quantity === 0);
    } else if (filterStock === 'in') {
      result = result.filter(p => p.quantity > 10);
    }

    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'quantity':
          aVal = a.quantity || 0;
          bVal = b.quantity || 0;
          break;
        case 'price':
          aVal = a.price || 0;
          bVal = b.price || 0;
          break;
        case 'category':
          aVal = a.category?.toLowerCase() || '';
          bVal = b.category?.toLowerCase() || '';
          break;
        default:
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchQuery, filterCategory, filterStock, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 10).length;
    const outOfStock = products.filter(p => p.quantity === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    return { total, lowStock, outOfStock, totalValue, categories };
  }, [products]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ background: 'white', borderRadius: '6px', padding: '1.25rem', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', margin: 0 }}>Products</h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{products.length} total</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button aria-label="Toggle filters" onClick={() => setShowFilters(!showFilters)} style={{ padding: '0.5rem 0.875rem', background: showFilters ? '#3b82f6' : 'white', color: showFilters ? 'white' : '#374151', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem', cursor: 'pointer' }}>Filters</button>
              <button aria-label="Export products CSV" onClick={exportToCSV} style={{ padding: '0.5rem 0.875rem', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem', cursor: 'pointer' }}>Export</button>
              <button aria-label="Add new product" onClick={() => { setForm({ name: "", quantity: 0, price: 0, category: "", shelf_location: "" }); setEditingId(null); setShowForm(true); }} className="btn-primary" style={{ padding: '0.5rem 0.875rem', borderRadius: '4px', fontSize: '0.875rem' }}>New</button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {[
            { label: 'Total', value: stats.total, color: '#3b82f6' },
            { label: 'Low Stock', value: stats.lowStock, color: '#f59e0b' },
            { label: 'Out', value: stats.outOfStock, color: '#ef4444' },
            { label: 'Value', value: `$${stats.totalValue.toFixed(0)}`, color: '#10b981' }
          ].map((stat, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '6px', padding: '0.875rem', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: '500', letterSpacing: '0.025em' }}>{stat.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '600', color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        {showFilters && (
          <div style={{ background: 'white', borderRadius: '6px', padding: '1rem', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Search</label>
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Stock</label>
                <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)} style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem', cursor: 'pointer' }}>
                  <option value="all">All</option>
                  <option value="in">In Stock</option>
                  <option value="low">Low</option>
                  <option value="out">Out</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: '#374151', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Sort</label>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem', cursor: 'pointer' }}>
                    <option value="name">Name</option>
                    <option value="quantity">Quantity</option>
                    <option value="price">Price</option>
                    <option value="category">Category</option>
                  </select>
                  <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} style={{ padding: '0.5rem 0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>{sortOrder === 'asc' ? '↑' : '↓'}</button>
                </div>
              </div>
            </div>
          </div>
        )}


        <div style={{ display: 'grid', gridTemplateColumns: showForm ? '320px 1fr' : '1fr', gap: '1rem' }}>
          
          {/* Form */}
          {showForm && (
            <div style={{ background: 'white', borderRadius: '6px', padding: '1.25rem', border: '1px solid #e5e7eb', height: 'fit-content' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>{editingId ? 'Edit Product' : 'Add Product'}</h2>
              <form onSubmit={submit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                  <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                  <input name="quantity" type="number" min="0" placeholder="Quantity" value={form.quantity} onChange={handleChange} required style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                  <input name="price" type="number" step="0.01" min="0" placeholder="Price" value={form.price} onChange={handleChange} required style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                  <input name="category" placeholder="Category" value={form.category} onChange={handleChange} style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                  <input name="shelf_location" placeholder="Location" value={form.shelf_location} onChange={handleChange} style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button aria-label={editingId ? 'Update product' : 'Add product'} type="submit" className="btn-primary" style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '500' }}>{editingId ? 'Update' : 'Add'}</button>
                  <button aria-label="Cancel editing" type="button" onClick={cancelEdit} style={{ padding: '0.5rem 0.875rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.875rem', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* List */}
          <div>
            {selectedProducts.length > 0 && (
              <div style={{ background: 'white', borderRadius: '6px', padding: '0.875rem', marginBottom: '0.75rem', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>{selectedProducts.length} selected</span>
                  <input type="number" step="0.1" placeholder="Price %" value={bulk.pricePercent} onChange={(e) => setBulk({ ...bulk, pricePercent: e.target.value })} style={{ width: '110px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem' }} />
                  <input type="text" placeholder="Set Category" value={bulk.category} onChange={(e) => setBulk({ ...bulk, category: e.target.value })} style={{ width: '180px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.875rem' }} />
                  <button onClick={handleBulkUpdate} className="btn-primary" style={{ padding: '0.5rem 0.875rem', borderRadius: '4px', fontSize: '0.875rem' }}>Apply</button>
                  <button onClick={() => setSelectedProducts([])} style={{ padding: '0.5rem 0.875rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '4px', fontSize: '0.875rem', cursor: 'pointer' }}>Clear Selection</button>
                </div>
              </div>
            )}
            <div style={{ background: 'white', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.75rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onChange={handleSelectAllProducts} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>Select all</span>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>Showing {filteredProducts.length}{searchQuery && ` of ${products.length}`}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedProducts.length > 0 && (
                  <>
                    <button onClick={handleBulkDelete} style={{ padding: '0.375rem 0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.875rem', cursor: 'pointer' }}>Delete</button>
                    <button onClick={() => setSelectedProducts([])} style={{ padding: '0.375rem 0.75rem', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '4px', fontSize: '0.875rem', cursor: 'pointer' }}>Clear</button>
                  </>
                )}
              </div>
            </div>
            
            {filteredProducts.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '6px', padding: '3rem', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>No products found</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredProducts.map(p => {
                  const isSelected = selectedProducts.includes(p.product_id);
                  const status = p.quantity === 0 ? 'out' : p.quantity <= 10 ? 'low' : 'ok';
                  const statusColor = status === 'out' ? '#ef4444' : status === 'low' ? '#f59e0b' : '#10b981';
                  
                  return (
                    <div key={p.product_id} style={{ background: 'white', borderRadius: '6px', padding: '1rem', border: `1px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <input type="checkbox" checked={isSelected} onChange={() => handleSelectProduct(p.product_id)} style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }} />
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: 0, marginBottom: '0.25rem' }}>{p.name}</h3>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          <span>Qty: <strong style={{ color: statusColor }}>{p.quantity}</strong></span>
                          <span>Price: <strong>${Number(p.price).toFixed(2)}</strong></span>
                          {p.category && <span>Cat: {p.category}</span>}
                          {p.shelf_location && <span>Loc: {p.shelf_location}</span>}

                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button aria-label={`Edit ${p.name}`} onClick={() => edit(p)} className="btn-primary" style={{ padding: '0.375rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' }}>Edit</button>
                        <button aria-label={`Delete ${p.name}`} onClick={() => remove(p.product_id)} className="btn-danger" style={{ padding: '0.375rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500' }}>Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}