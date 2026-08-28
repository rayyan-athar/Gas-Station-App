import { useEffect, useState, useMemo } from "react";
import { getAssociates, addAssociate, updateAssociate, deleteAssociate } from "../api";

export default function Associates() {
  const [associates, setAssociates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAssociates, setSelectedAssociates] = useState([]);
  const [form, setForm] = useState({ 
    name: "", 
    birthdate: "", 
    ssn: "", 
    hours_worked: 0,
    position: "",
    hourly_rate: 0,
    email: "",
    phone: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [hoursForm, setHoursForm] = useState({ id: null, hours: 0 });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setAssociates(await getAssociates());
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === 'ssn') {
      // Enforce max digits and format as XXX-XX-XXXX without removing calendar
      const digits = value.replace(/\D/g, '').slice(0, 9);
      let formatted = digits;
      if (digits.length > 3 && digits.length <= 5) {
        formatted = digits.slice(0,3) + '-' + digits.slice(3);
      } else if (digits.length > 5) {
        formatted = digits.slice(0,3) + '-' + digits.slice(3,5) + '-' + digits.slice(5);
      }
      return setForm({ ...form, ssn: formatted });
    }
    if (name === 'birthdate') {
      // Allow native date input; just store value and let min/max validate
      return setForm({ ...form, birthdate: value });
    }
    setForm({ ...form, [name]: value });
  }

  function handleHoursChange(e) {
    setHoursForm({ ...hoursForm, [e.target.name]: e.target.value });
  }

  async function submit(e) {
    e.preventDefault();
    if (editingId) {
      await updateAssociate(editingId, form);
      setEditingId(null);
    } else {
      await addAssociate(form);
    }
    setForm({ 
      name: "", 
      birthdate: "", 
      ssn: "", 
      hours_worked: 0,
      position: "",
      hourly_rate: 0,
      email: "",
      phone: ""
    });
    load();
  }

  function startEdit(associate) {
    setForm({
      name: associate.name,
      birthdate: associate.birthdate,
      ssn: associate.ssn,
      hours_worked: associate.hours_worked || 0,
      position: associate.position || "",
      hourly_rate: associate.hourly_rate || 0,
      email: associate.email || "",
      phone: associate.phone || ""
    });
    setEditingId(associate.associate_id);
  }

  // Alias for startEdit
  const edit = startEdit;

  function cancelEdit() {
    setForm({ 
      name: "", 
      birthdate: "", 
      ssn: "", 
      hours_worked: 0,
      position: "",
      hourly_rate: 0,
      email: "",
      phone: ""
    });
    setEditingId(null);
  }

  async function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this associate?")) {
      await deleteAssociate(id);
      load();
    }
  }

  // Alias for handleDelete
  const remove = handleDelete;

  async function addHours(e) {
    e.preventDefault();
    if (hoursForm.id && hoursForm.hours > 0) {
      const associate = associates.find(a => a.associate_id === parseInt(hoursForm.id));
      const newHours = (associate?.hours_worked || 0) + parseFloat(hoursForm.hours);
      await updateAssociate(hoursForm.id, { hours_worked: newHours });
      setHoursForm({ id: null, hours: 0 });
      load();
    }
  }

  function handleSelectAssociate(id) {
    setSelectedAssociates(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  }

  function handleSelectAll() {
    if (selectedAssociates.length === filteredAssociates.length) {
      setSelectedAssociates([]);
    } else {
      setSelectedAssociates(filteredAssociates.map(a => a.associate_id));
    }
  }

  async function handleBulkDelete() {
    if (window.confirm(`Are you sure you want to delete ${selectedAssociates.length} associates?`)) {
      await Promise.all(selectedAssociates.map(id => deleteAssociate(id)));
      setSelectedAssociates([]);
      load();
    }
  }

  function exportToCSV() {
    const headers = ['ID', 'Name', 'Birth Date', 'SSN', 'Hours Worked', 'Position', 'Hourly Rate', 'Email', 'Phone'];
    const rows = filteredAssociates.map(a => [
      a.associate_id,
      a.name,
      a.birthdate,
      a.ssn,
      a.hours_worked || 0,
      a.position || '',
      a.hourly_rate || 0,
      a.email || '',
      a.phone || ''
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'associates.csv';
    a.click();
  }

  // Advanced filtering and sorting with useMemo
  const filteredAssociates = useMemo(() => {
    let result = Array.isArray(associates) ? [...associates] : [];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.name?.toLowerCase().includes(query) ||
        a.ssn?.toLowerCase().includes(query) ||
        a.position?.toLowerCase().includes(query) ||
        a.email?.toLowerCase().includes(query) ||
        a.phone?.toLowerCase().includes(query) ||
        a.associate_id?.toString().includes(query)
      );
    }

    // Status filter (based on hours worked)
    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        result = result.filter(a => (a.hours_worked || 0) > 0);
      } else if (filterStatus === 'inactive') {
        result = result.filter(a => (a.hours_worked || 0) === 0);
      } else if (filterStatus === 'fulltime') {
        result = result.filter(a => (a.hours_worked || 0) >= 160);
      }
    }

    // Sorting
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'hours':
          aVal = a.hours_worked || 0;
          bVal = b.hours_worked || 0;
          break;
        case 'rate':
          aVal = a.hourly_rate || 0;
          bVal = b.hourly_rate || 0;
          break;
        case 'birthdate':
          aVal = new Date(a.birthdate || 0);
          bVal = new Date(b.birthdate || 0);
          break;
        default:
          aVal = a[sortBy] || '';
          bVal = b[sortBy] || '';
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [associates, searchQuery, filterStatus, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const total = associates.length;
    const active = associates.filter(a => (a.hours_worked || 0) > 0).length;
    const totalHours = associates.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
    const avgHours = total > 0 ? (totalHours / total).toFixed(1) : 0;
    const fullTime = associates.filter(a => (a.hours_worked || 0) >= 160).length;
    return { total, active, totalHours, avgHours, fullTime };
  }, [associates]);

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    marginBottom: '2rem',
    animation: 'fadeIn 0.6s ease'
  };

  const headerStyle = {
    fontSize: '2rem',
    fontWeight: '800',
    color: 'white',
    marginBottom: '2rem',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem'
  };

  const associateCardStyle = {
    background: 'white',
    borderRadius: '18px',
    padding: '2rem',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.10)',
    transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
    border: '2px solid transparent',
    cursor: 'pointer',
    minHeight: '260px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      padding: '2rem',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        
        {/* TOP BAR */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '24px',
          padding: '1.5rem 2rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div>
              <h1 style={{ 
                fontSize: '2.2rem', 
                fontWeight: '800', 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
                letterSpacing: '-0.5px'
              }}>
                👥 Team Management
              </h1>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: '#64748b', fontWeight: '500' }}>
                Manage {associates.length} associates • {stats.active} active
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '0.8rem 1.5rem',
                background: showFilters ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f1f5f9',
                color: showFilters ? 'white' : '#64748b',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: showFilters ? '0 8px 20px rgba(102, 126, 234, 0.3)' : 'none',
                transition: 'all 0.3s'
              }}
            >
              🔍 Filters
            </button>
            <button
              onClick={exportToCSV}
              style={{
                padding: '0.8rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
              }}
            >
              📊 Export CSV
            </button>
            <button
              onClick={() => {
                cancelEdit();
                setForm({ ...form, name: 'New Associate' });
              }}
              style={{
                padding: '0.8rem 1.5rem',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '14px',
                fontWeight: '700',
                cursor: 'pointer',
                fontSize: '1rem',
                boxShadow: '0 8px 20px rgba(240, 147, 251, 0.3)'
              }}
            >
              ➕ New Associate
            </button>
          </div>
        </div>

        {/* STATISTICS DASHBOARD */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            { label: 'Total Team', value: stats.total, emoji: '👥', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
            { label: 'Active Members', value: stats.active, emoji: '✅', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
            { label: 'Total Hours', value: stats.totalHours.toFixed(0), emoji: '⏰', gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
            { label: 'Avg Hours', value: stats.avgHours, emoji: '📊', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
            { label: 'Full-Time', value: stats.fullTime, emoji: '💼', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
          ].map((stat, idx) => (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '1.5rem',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
            }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{stat.emoji}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>
                {stat.label}
              </div>
              <div style={{ 
                fontSize: '2rem', 
                fontWeight: '800', 
                background: stat.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* FILTERS BAR */}
        {showFilters && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '1.5rem',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            animation: 'slideDown 0.3s ease'
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
              gap: '1.5rem' 
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>
                  🔍 SEARCH
                </label>
                <input
                  type="text"
                  placeholder="Name, SSN, Position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.2rem',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>
                  📋 STATUS FILTER
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.9rem 1.2rem',
                    borderRadius: '12px',
                    border: '2px solid #e2e8f0',
                    fontSize: '0.95rem',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">All Associates</option>
                  <option value="active">Active (Hours {">"}  0)</option>
                  <option value="inactive">Inactive (No Hours)</option>
                  <option value="fulltime">Full-Time (≥ 160h)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem' }}>
                  ⚡ SORT BY
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '0.9rem 1.2rem',
                      borderRadius: '12px',
                      border: '2px solid #e2e8f0',
                      fontSize: '0.95rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="name">Name</option>
                    <option value="hours">Hours Worked</option>
                    <option value="rate">Hourly Rate</option>
                    <option value="birthdate">Birth Date</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    style={{
                      padding: '0.9rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '1rem'
                    }}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
          {/* Left: Forms Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ ...cardStyle, marginBottom: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#475569', marginBottom: '1.2rem', letterSpacing: '-0.5px' }}>{editingId ? 'Edit Associate' : 'Add New Associate'}</h2>
              <form onSubmit={submit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.2rem' }}>
                  <input name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required style={{ padding: '0.85rem', fontSize: '1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }} />
                  <input name="birthdate" type="date" placeholder="Birthdate" value={form.birthdate} onChange={handleChange} required min="1900-01-01" max={new Date().toISOString().slice(0,10)} style={{ padding: '0.85rem', fontSize: '1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }} />
                  <input name="ssn" placeholder="SSN (XXX-XX-XXXX)" value={form.ssn} onChange={handleChange} required pattern="\d{3}-\d{2}-\d{4}" maxLength={11} style={{ padding: '0.85rem', fontSize: '1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontFamily: 'monospace' }} />
                  {editingId && (
                    <input name="hours_worked" type="number" step="0.1" placeholder="Hours Worked" value={form.hours_worked} onChange={handleChange} style={{ padding: '0.85rem', fontSize: '1rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" style={{ fontSize: '1rem', padding: '0.7rem 1.5rem', borderRadius: '8px', fontWeight: '700' }}>{editingId ? 'Update Associate' : 'Add Associate'}</button>
                  {editingId && (
                    <button type="button" onClick={cancelEdit} style={{ background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)', color: 'white', padding: '0.7rem 1.5rem', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                  )}
                </div>
              </form>
            </div>
            <div style={{ ...cardStyle, marginBottom: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#475569', marginBottom: '1.2rem', letterSpacing: '-0.5px' }}>Add Work Hours</h2>
              <form onSubmit={addHours}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select name="id" value={hoursForm.id || ""} onChange={handleHoursChange} required style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.7rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                    <option value="">Select Associate</option>
                    {associates.map(a => (
                      <option key={a.associate_id} value={a.associate_id}>{a.name}</option>
                    ))}
                  </select>
                  <input name="hours" type="number" step="0.1" min="0" placeholder="Hours" value={hoursForm.hours} onChange={handleHoursChange} required style={{ flex: '0 1 80px', minWidth: '80px', padding: '0.7rem', borderRadius: '8px', border: '1.5px solid #cbd5e1' }} />
                  <button type="submit" className="btn-success" style={{ flex: '0 1 auto', fontSize: '1rem', padding: '0.7rem 1.5rem', borderRadius: '8px', fontWeight: '700' }}>Add Hours</button>
                </div>
              </form>
            </div>
          </div>
          {/* Right: Associates List Section */}
          <div style={{ ...cardStyle, marginBottom: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', minHeight: '500px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#475569', margin: 0, letterSpacing: '-0.5px' }}>Associates List ({filteredAssociates.length}{searchQuery && ` of ${associates.length}`})</h2>
            </div>
            {filteredAssociates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '1.1rem' }}>{searchQuery ? `No associates found matching "${searchQuery}"` : 'No associates yet. Add your first associate!'}</div>
            ) : (
              <div style={{ ...gridStyle, gap: '1.2rem' }}>
                {filteredAssociates.map(associate => (
                  <div key={associate.associate_id} style={{ ...associateCardStyle, minHeight: '180px', padding: '1.1rem' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(99, 102, 241, 0.15)'; e.currentTarget.style.borderColor = '#6366f1'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)'; e.currentTarget.style.borderColor = 'transparent'; }}>
                    <div style={{ marginBottom: '0.5rem' }}>

                      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.05rem', fontWeight: '700', color: '#1e293b' }}>{associate.name}</h4>
                      <div style={{ display: 'grid', gap: '0.25rem', marginBottom: '0.5rem', color: '#475569', fontSize: '0.91rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '600', color: '#64748b' }}>ID:</span><span>#{associate.associate_id}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '600', color: '#64748b' }}>Birthdate:</span><span>{associate.birthdate}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '600', color: '#64748b' }}>SSN:</span><span style={{ fontFamily: 'monospace' }}>{associate.ssn}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: '600', color: '#64748b' }}>Hours:</span><span style={{ padding: '0.22rem 0.6rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700', background: associate.hours_worked >= 40 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : associate.hours_worked >= 20 ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>{associate.hours_worked || 0} hrs</span></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '2px solid #f1f5f9' }}>
                      <button onClick={() => startEdit(associate)} className="btn-primary" style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Edit</button>
                      <button onClick={() => handleDelete(associate.associate_id)} className="btn-danger" style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem 1rem' }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
