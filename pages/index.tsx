// ABOUTME: EIP Home Page - Pages Router version
// ABOUTME: Simple entry point for testing frontend compilation

import React from 'react';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                EIP Content Runtime
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                AI-powered content generation with compliance control
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <a
                href="/compliance"
                style={{
                  backgroundColor: '#7c3aed',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Compliance Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

          {/* Compliance Dashboard Card */}
          <a
            href="/compliance"
            style={{ textDecoration: 'none' }}
          >
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb',
              padding: '1.5rem',
              transition: 'box-shadow 0.2s',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ backgroundColor: '#7c3aed', borderRadius: '50%', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div style={{ marginLeft: '1rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827', margin: '0 0 0.25rem 0' }}>
                    Compliance Dashboard
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                    Real-time compliance monitoring and alerts
                  </p>
                </div>
              </div>
            </div>
          </a>

          {/* API Status Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ backgroundColor: '#10b981', borderRadius: '50%', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827', margin: '0 0 0.25rem 0' }}>
                  Backend APIs
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#10b981', margin: 0 }}>
                  All systems operational
                </p>
              </div>
            </div>
          </div>

          {/* Test API Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ backgroundColor: '#3b82f6', borderRadius: '50%', width: '2rem', height: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div style={{ marginLeft: '1rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#111827', margin: '0 0 0.25rem 0' }}>
                  API Endpoints
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#3b82f6', margin: 0 }}>
                  <a href="/api/compliance/stats" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    /api/compliance/stats
                  </a>
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}