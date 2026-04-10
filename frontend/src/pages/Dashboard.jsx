import { useState, useEffect } from 'react';
import { patientApi } from '../api';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function Dashboard({ user }) {
  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    age: '',
    gender: 'Other',
    contact: '',
    address: '',
    medicalHistory: ''
  });

  const fetchPatients = async () => {
    try {
      const res = await patientApi.get('/patients');
      setPatients(res.data);
    } catch (error) {
      console.error('Failed to fetch patients', error);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openModal = (patient = null) => {
    if (patient) {
      setFormData(patient);
    } else {
      setFormData({
        _id: '', name: '', age: '', gender: 'Other', contact: '', address: '', medicalHistory: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData._id) {
        await patientApi.put(`/patients/${formData._id}`, formData);
      } else {
        await patientApi.post('/patients', formData);
      }
      setIsModalOpen(false);
      fetchPatients();
    } catch (error) {
      console.error('Failed to save patient', error);
      alert('Error saving patient. Are you authenticated?');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this patient record?')) {
      try {
        await patientApi.delete(`/patients/${id}`);
        fetchPatients();
      } catch (error) {
        console.error('Failed to delete patient', error);
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Patient Management</h2>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Patient
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Contact</th>
              <th>Medical History</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center text-muted" style={{ padding: '2rem' }}>
                  No patients found.
                </td>
              </tr>
            ) : (
              patients.map(p => (
                <tr key={p._id}>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td>{p.age}</td>
                  <td>{p.gender}</td>
                  <td>{p.contact}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    {p.medicalHistory?.slice(0, 50)}{p.medicalHistory?.length > 50 ? '...' : ''}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.5rem', marginRight: '0.5rem' }} onClick={() => openModal(p)}>
                      <Edit2 size={16} />
                    </button>
                    {(user?.role === 'admin') && (
                      <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(p._id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="mb-4">{formData._id ? 'Edit Patient' : 'Add Patient'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input required type="text" className="form-input" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Age</label>
                  <input required type="number" className="form-input" name="age" value={formData.age} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Gender</label>
                  <select required className="form-input" name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Contact</label>
                <input required type="text" className="form-input" name="contact" value={formData.contact} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Address (Optional)</label>
                <input type="text" className="form-input" name="address" value={formData.address} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Medical History</label>
                <textarea className="form-input" name="medicalHistory" rows="3" value={formData.medicalHistory} onChange={handleInputChange}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
