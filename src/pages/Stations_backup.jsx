import { useEffect, useState } from "react";
import { getStations, refillStation } from "../api";

export default function Stations() {
  const [stations, setStations] = useState([]);
  const [refillForm, setRefillForm] = useState({ tankNumber: null, amount: 0 });
  const [removeForm, setRemoveForm] = useState({ tankNumber: null, amount: 0 });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStations(await getStations());
  }

  function handleRefillChange(e) {
    setRefillForm({ ...refillForm, [e.target.name]: e.target.value });
  }

  function handleRemoveChange(e) {
    setRemoveForm({ ...removeForm, [e.target.name]: e.target.value });
  }

  async function handleRefill(e) {
    e.preventDefault();
    if (refillForm.tankNumber && refillForm.amount > 0) {
      const tank = stations.find(s => s.tank_number === parseInt(refillForm.tankNumber));
      if (tank) {
        const newAmount = tank.current_amount + parseFloat(refillForm.amount);
        if (newAmount > tank.capacity) {
          alert(`Error: Refilling ${refillForm.amount} gallons would exceed tank capacity of ${tank.capacity} gallons. Maximum refill: ${(tank.capacity - tank.current_amount).toFixed(2)} gallons.`);
          return;
        }
        await refillStation(refillForm.tankNumber, parseFloat(refillForm.amount));
        setRefillForm({ tankNumber: null, amount: 0 });
        load();
      }
    }
  }

  async function handleRemove(e) {
    e.preventDefault();
    if (removeForm.tankNumber && removeForm.amount > 0) {
      const tank = stations.find(s => s.tank_number === parseInt(removeForm.tankNumber));
      if (tank) {
        const newAmount = tank.current_amount - parseFloat(removeForm.amount);
        if (newAmount < 0) {
          alert(`Error: Removing ${removeForm.amount} gallons would result in negative amount. Maximum removal: ${tank.current_amount.toFixed(2)} gallons.`);
          return;
        }
        // Pass negative amount to subtract
        await refillStation(removeForm.tankNumber, -parseFloat(removeForm.amount));
        setRemoveForm({ tankNumber: null, amount: 0 });
        load();
      }
    }
  }

  // Group stations by tank
  const tanksMap = {};
  stations.forEach(station => {
    if (!tanksMap[station.tank_number]) {
      tanksMap[station.tank_number] = {
        tank_number: station.tank_number,
        capacity: station.capacity,
        current_amount: station.current_amount,
        pumps: []
      };
    }
    tanksMap[station.tank_number].pumps.push(station.pump_number);
  });

  const tanks = Object.values(tanksMap);

  const cardStyle = {
    background: 'white',
    borderRadius: '8px',
    padding: '1.25rem',
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

  const tankCardStyle = {
    background: 'white',
    borderRadius: '8px',
    padding: '1rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb'
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        {/* Header */}
        <div style={{ background: 'white', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={headerStyle}>Stations</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2.5rem', alignItems: 'start' }}>
          {/* Left: Tank Actions Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ ...cardStyle }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>Refill Tank</h2>
              <form onSubmit={handleRefill}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <select name="tankNumber" value={refillForm.tankNumber || ""} onChange={handleRefillChange} required style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}>
                    <option value="">Select Tank</option>
                    {tanks.map(tank => (
                      <option key={tank.tank_number} value={tank.tank_number}>Tank #{tank.tank_number} (Current: {tank.current_amount.toFixed(2)} / {tank.capacity.toFixed(2)} gal)</option>
                    ))}
                  </select>
                  <input name="amount" type="number" step="0.01" min="0.01" placeholder="Gallons to add" value={refillForm.amount} onChange={handleRefillChange} required style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }} />
                </div>
                <button type="submit" className="btn-success" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500' }}>Refill</button>
              </form>
            </div>
            <div style={{ ...cardStyle }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>Remove Fuel</h2>
              <form onSubmit={handleRemove}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <select name="tankNumber" value={removeForm.tankNumber || ""} onChange={handleRemoveChange} required style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }}>
                    <option value="">Select Tank</option>
                    {tanks.map(tank => (
                      <option key={tank.tank_number} value={tank.tank_number}>Tank #{tank.tank_number} (Current: {tank.current_amount.toFixed(2)} / {tank.capacity.toFixed(2)} gal)</option>
                    ))}
                  </select>
                  <input name="amount" type="number" step="0.01" min="0.01" placeholder="Gallons to remove" value={removeForm.amount} onChange={handleRemoveChange} required style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.875rem' }} />
                </div>
                <button type="submit" className="btn-danger" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '500' }}>Remove</button>
              </form>
            </div>
          </div>
          {/* Right: Stations Overview Section */}
          <div style={{ ...cardStyle, minHeight: '400px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#111827', margin: 0 }}>Stations Overview</h2>
            </div>
            {tanks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '1.1rem' }}>No station data loaded yet.</div>
            ) : (
              <div style={{ display: 'grid', gap: '1.2rem' }}>
                {tanks.map(tank => {
                  const percentage = (tank.current_amount / tank.capacity) * 100;
                  const isLow = percentage < 20;
                  const isMedium = percentage >= 20 && percentage < 50;
                  const isHigh = percentage >= 50;
                  return (
                    <div key={tank.tank_number} style={{ ...tankCardStyle, minHeight: '160px' }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '600', color: '#111827' }}>Tank #{tank.tank_number}</h3>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', background: isLow ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981', color: 'white' }}>{percentage.toFixed(1)}%</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.25rem', marginBottom: '0.5rem', color: '#374151', fontSize: '0.85rem' }}>
                          <div><div style={{ fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Capacity</div><div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{tank.capacity.toFixed(2)} gal</div></div>
                          <div><div style={{ fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Current</div><div style={{ fontSize: '1rem', fontWeight: '600', color: '#111827' }}>{tank.current_amount.toFixed(2)} gal</div></div>
                          <div><div style={{ fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Available</div><div style={{ fontSize: '1rem', fontWeight: '600', color: '#10b981' }}>{(tank.capacity - tank.current_amount).toFixed(2)} gal</div></div>
                          <div><div style={{ fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }}>Status</div><div style={{ fontSize: '0.85rem', fontWeight: '600', color: isLow ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981' }}>{isLow ? 'LOW' : isMedium ? 'MEDIUM' : 'GOOD'}</div></div>
                        </div>
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${percentage}%`, height: '100%', background: isLow ? '#ef4444' : isMedium ? '#f59e0b' : '#10b981' }} />
                        </div>
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Connected Pumps</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {tank.pumps.map(pumpNumber => (
                            <button key={pumpNumber} type="button" onClick={() => { setRefillForm({ ...refillForm, tankNumber: tank.tank_number.toString() }); setRemoveForm({ ...removeForm, tankNumber: tank.tank_number.toString() }); }} style={{ padding: '0.4rem 0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.825rem', cursor: 'pointer', fontWeight: '500' }}>Pump #{pumpNumber}</button>
                          ))}
                        </div>
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
