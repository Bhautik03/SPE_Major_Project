import { useState, useEffect } from 'react';
import { patientApi } from '../api';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';

export default function Dashboard({ user }) {
  const [patients, setPatients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedViewPatient, setSelectedViewPatient] = useState(null);
  const [formData, setFormData] = useState({
    _id: '',
    name: '',
    age: '',
    gender: 'Other',
    contact: '',
    address: '',
    newMedicalHistory: ''
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
      setFormData({ ...patient, newMedicalHistory: '' });
    } else {
      setFormData({
        _id: '', name: '', age: '', gender: 'Other', contact: '', address: '', newMedicalHistory: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate contact length
    if (formData.contact && formData.contact.toString().length !== 10) {
      alert("Contact must be exactly 10 characters long.");
      return;
    }

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
                    {p.medicalHistory?.length || 0} record(s)
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline" style={{ padding: '0.5rem', marginRight: '0.5rem' }} onClick={() => setSelectedViewPatient(p)}>
                      <Eye size={16} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '0.5rem', marginRight: '0.5rem' }} onClick={() => openModal(p)}>
                      <Edit2 size={16} />
                    </button>
                    <button className="btn btn-danger" style={{ padding: '0.5rem' }} onClick={() => handleDelete(p._id)}>
                      <Trash2 size={16} />
                    </button>
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
                <label className="form-label">Name <span style={{color: '#ff4d4f'}}>*</span></label>
                <input required type="text" className="form-input" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Age <span style={{color: '#ff4d4f'}}>*</span></label>
                  <input required type="number" className="form-input" name="age" value={formData.age} onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Gender <span style={{color: '#ff4d4f'}}>*</span></label>
                  <select required className="form-input" name="gender" value={formData.gender} onChange={handleInputChange}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Contact <span style={{color: '#ff4d4f'}}>*</span></label>
                <input required type="text" maxLength="10" className="form-input" name="contact" value={formData.contact} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Address (Optional)</label>
                <input type="text" className="form-input" name="address" value={formData.address} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label className="form-label">{formData._id ? 'Add New Medical Entry' : 'Initial Medical History'}</label>
                <textarea className="form-input" name="newMedicalHistory" rows="3" value={formData.newMedicalHistory} onChange={handleInputChange}></textarea>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedViewPatient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="mb-4">Patient Profile: {selectedViewPatient.name}</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.875rem', display: 'block' }}>Age</span>
                  <strong>{selectedViewPatient.age}</strong>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.875rem', display: 'block' }}>Gender</span>
                  <strong>{selectedViewPatient.gender}</strong>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.875rem', display: 'block' }}>Contact</span>
                  <strong>{selectedViewPatient.contact}</strong>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.875rem', display: 'block' }}>Address</span>
                  <strong>{selectedViewPatient.address || 'Not provided'}</strong>
                </div>
              </div>
              
              <span className="text-muted" style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Medical History</span>
              <div style={{ minHeight: '80px' }}>
                {selectedViewPatient.medicalHistory && selectedViewPatient.medicalHistory.length > 0 && typeof selectedViewPatient.medicalHistory !== 'string' ? (
                  <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                    {selectedViewPatient.medicalHistory.map((entry, idx) => (
                      <li key={entry._id || idx} style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          📅 {new Date(entry.date).toLocaleString()}
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                          {entry.details}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                    {typeof selectedViewPatient.medicalHistory === 'string' ? selectedViewPatient.medicalHistory : 'No medical history available.'}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setSelectedViewPatient(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
