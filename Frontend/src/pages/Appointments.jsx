import React from 'react';
import AppointmentsTable from '../components/AppointmentsTable';

export default function Appointments({ appointments, onUpdateStatus }) {
  return (
    <div className="crm-page-container">
      <AppointmentsTable 
        appointments={appointments} 
        onUpdateStatus={onUpdateStatus}
      />
    </div>
  );
}
