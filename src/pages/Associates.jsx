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
    background: 'white',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    marginBottom: '1rem'
  };

  const headerStyle = {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '0.75rem'
  };

  const associateCardStyle = {
    background: 'white',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    cursor: 'default',
    minHeight: '160px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f9fafb',
      padding: '1.25rem',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    }}>
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        
        {/* Header */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={headerStyle}>Associates</h1>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>Manage {associates.length} associates • {stats.active} active</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '0.5rem 0.75rem', background: showFilters ? '#3b82f6' : '#f3f4f6', color: showFilters ? 'white' : '#374151', borderRadius: '6px', fontWeight: 500, fontSize: '0.875rem' }}>Filters</button>
            <button onClick={exportToCSV} className="btn-success" style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', fontWeight: 500, fontSize: '0.875rem' }}>Export CSV</button>
            <button onClick={() => cancelEdit()} className="btn-primary" style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', fontWeight: 500, fontSize: '0.875rem' }}>New</button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Total', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Total Hours', value: stats.totalHours.toFixed(0) },
            { label: 'Avg Hours', value: stats.avgHours },
            { label: 'Full-Time', value: stats.fullTime }
          ].map((stat, idx) => (
            <div key={idx} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', marginBottom: '0.25rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>{stat.value}</div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', alignItems: 'start' }}>
          {/* Left: Forms Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ ...cardStyle }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>{editingId ? 'Edit Associate' : 'Add Associate'}</h2>
              <form onSubmit={submit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} required style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  <input name="birthdate" type="date" placeholder="Birthdate" value={form.birthdate} onChange={handleChange} required min="1900-01-01" max={new Date().toISOString().slice(0,10)} style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  <input name="ssn" placeholder="SSN (XXX-XX-XXXX)" value={form.ssn} onChange={handleChange} required pattern="\d{3}-\d{2}-\d{4}" maxLength={11} style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db', fontFamily: 'monospace' }} />
                  {editingId && (
                    <input name="hours_worked" type="number" step="0.1" placeholder="Hours worked" value={form.hours_worked} onChange={handleChange} style={{ padding: '0.5rem', fontSize: '0.875rem', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500' }}>{editingId ? 'Update' : 'Add'}</button>
                  {editingId && (
                    <button type="button" onClick={cancelEdit} style={{ background: '#6b7280', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>Cancel</button>
                  )}
                </div>
              </form>
            </div>
            <div style={{ ...cardStyle }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>Add Work Hours</h2>
              <form onSubmit={addHours}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select name="id" value={hoursForm.id || ""} onChange={handleHoursChange} required style={{ flex: '1 1 120px', minWidth: '120px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                    <option value="">Select Associate</option>
                    {associates.map(a => (
                      <option key={a.associate_id} value={a.associate_id}>{a.name}</option>
                    ))}
                  </select>
                  <input name="hours" type="number" step="0.1" min="0" placeholder="Hours" value={hoursForm.hours} onChange={handleHoursChange} required style={{ flex: '0 1 80px', minWidth: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db' }} />
                  <button type="submit" className="btn-success" style={{ flex: '0 1 auto', fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500' }}>Add Hours</button>
                </div>
              </form>
            </div>
          </div>
          {/* Right: Associates List Section */}
          <div style={{ ...cardStyle, minHeight: '400px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>Associates ({filteredAssociates.length}{searchQuery && ` of ${associates.length}`})</h2>
              {filteredAssociates.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.85rem', color: '#374151' }}>
                    <input type="checkbox" checked={selectedAssociates.length === filteredAssociates.length && filteredAssociates.length > 0} onChange={handleSelectAll} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    Select all
                  </label>
                </div>
              )}
            </div>
            {selectedAssociates.length > 0 && (
              <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.75rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: '#374151' }}>{selectedAssociates.length} selected</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={handleBulkDelete} className="btn-danger" style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>Delete</button>
                  <button onClick={() => setSelectedAssociates([])} style={{ padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', background: '#f3f4f6', color: '#374151', border: 'none' }}>Clear</button>
                </div>
              </div>
            )}
            {filteredAssociates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#6b7280', fontSize: '0.95rem' }}>{searchQuery ? `No associates found matching "${searchQuery}"` : 'No associates yet. Add your first associate.'}</div>
            ) : (
              <div style={{ ...gridStyle }}>
                {filteredAssociates.map(associate => (
                  <div key={associate.associate_id} style={{ ...associateCardStyle, border: selectedAssociates.includes(associate.associate_id) ? '1px solid #3b82f6' : '1px solid #e5e7eb' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <input type="checkbox" checked={selectedAssociates.includes(associate.associate_id)} onChange={() => handleSelectAssociate(associate.associate_id)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>{associate.name}</h4>
                      </div>
                      <div style={{ display: 'grid', gap: '0.25rem', marginBottom: '0.5rem', color: '#374151', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '500', color: '#6b7280' }}>ID</span><span>#{associate.associate_id}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '500', color: '#6b7280' }}>Birthdate</span><span>{associate.birthdate}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: '500', color: '#6b7280' }}>SSN</span><span style={{ fontFamily: 'monospace' }}>{associate.ssn}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontWeight: '500', color: '#6b7280' }}>Hours</span><span style={{ padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: (associate.hours_worked || 0) >= 40 ? '#10b981' : (associate.hours_worked || 0) >= 20 ? '#f59e0b' : '#ef4444', color: 'white' }}>{associate.hours_worked || 0} hrs</span></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #e5e7eb' }}>
                      <button onClick={() => startEdit(associate)} className="btn-primary" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>Edit</button>
                      <button onClick={() => handleDelete(associate.associate_id)} className="btn-danger" style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>Delete</button>
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
