/**
 * Session Export Utilities
 * Provides functions to export session data as CSV or PDF
 */

/**
 * Export session data as CSV
 */
export const exportSessionToCSV = ({ session, transcript = [], suggestions = [] }) => {
  if (!session) {
    console.error('Cannot export: session data is missing');
    return;
  }
  
  const lines = [];
  
  // Header
  lines.push('GHOST Session Export');
  lines.push(`Session ID: ${session.id || 'Unknown'}`);
  lines.push(`Date: ${session.lastActivity ? new Date(session.lastActivity).toLocaleString() : 'Unknown'}`);
  lines.push(`Mode: ${session.mode || 'sales'}`);
  lines.push('');
  
  // Transcript section
  if (transcript.length > 0) {
    lines.push('=== TRANSCRIPT ===');
    lines.push('Speaker,Time,Text');
    transcript.forEach((entry) => {
      const speaker = (entry.speaker || 'Unknown').replace(/,/g, ';');
      const time = entry.time || (entry.createdAt?.toDate?.()?.toLocaleTimeString() || '');
      const text = (entry.text || entry.content || '').replace(/,/g, ';').replace(/\n/g, ' ');
      lines.push(`"${speaker}","${time}","${text}"`);
    });
    lines.push('');
  }
  
  // Suggestions section
  if (suggestions.length > 0) {
    lines.push('=== COACHING CUES ===');
    lines.push('Time,Text,Triggers');
    suggestions.forEach((suggestion) => {
      const time = suggestion.createdAt?.toDate?.()?.toLocaleTimeString() || '';
      const text = (suggestion.text || suggestion.content || '').replace(/,/g, ';').replace(/\n/g, ' ');
      const triggers = [];
      if (suggestion.trigger?.objection) triggers.push('Objection');
      if (suggestion.trigger?.competitor) triggers.push('Competitor');
      if (suggestion.trigger?.timeline) triggers.push('Timeline');
      const triggersStr = triggers.join('; ') || 'None';
      lines.push(`"${time}","${text}","${triggersStr}"`);
    });
  }
  
  // Create CSV blob and download
  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `ghost-session-${session.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export session data as PDF (using browser print functionality)
 */
export const exportSessionToPDF = ({ session, transcript = [], suggestions = [] }) => {
  if (!session) {
    console.error('Cannot export: session data is missing');
    return;
  }
  
  // Create a printable HTML document
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export as PDF');
    return;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>GHOST Session Export - ${session.id.substring(0, 8)}</title>
        <style>
          @media print {
            @page {
              margin: 1in;
            }
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #3b82f6;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .meta {
            display: flex;
            gap: 20px;
            font-size: 12px;
            color: #6b7280;
            margin-top: 10px;
          }
          .section {
            margin-bottom: 40px;
          }
          .section h2 {
            color: #1f2937;
            font-size: 18px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
            margin-bottom: 20px;
          }
          .entry {
            margin-bottom: 16px;
            padding: 12px;
            background: #f9fafb;
            border-left: 3px solid #3b82f6;
            border-radius: 4px;
          }
          .entry-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
          }
          .speaker {
            font-weight: 600;
            color: #3b82f6;
          }
          .time {
            color: #6b7280;
          }
          .text {
            color: #1f2937;
            font-size: 14px;
          }
          .suggestion {
            border-left-color: #f59e0b;
            background: #fffbeb;
          }
          .suggestion .speaker {
            color: #f59e0b;
          }
          .triggers {
            display: flex;
            gap: 8px;
            margin-top: 8px;
            flex-wrap: wrap;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
          }
          .badge-red {
            background: #fee2e2;
            color: #991b1b;
          }
          .badge-yellow {
            background: #fef3c7;
            color: #92400e;
          }
          .badge-green {
            background: #d1fae5;
            color: #065f46;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GHOST Session Export</h1>
          <div class="meta">
            <span><strong>Session ID:</strong> ${session.id}</span>
            <span><strong>Date:</strong> ${session.lastActivity ? new Date(session.lastActivity).toLocaleString() : 'Unknown'}</span>
            <span><strong>Mode:</strong> ${session.mode || 'sales'}</span>
          </div>
        </div>
        
        ${transcript.length > 0 ? `
          <div class="section">
            <h2>Transcript (${transcript.length} messages)</h2>
            ${transcript.map((entry) => `
              <div class="entry">
                <div class="entry-header">
                  <span class="speaker">${entry.speaker || 'Unknown'}</span>
                  <span class="time">${entry.time || (entry.createdAt?.toDate?.()?.toLocaleTimeString() || '')}</span>
                </div>
                <div class="text">${(entry.text || entry.content || '').replace(/\n/g, '<br>')}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${suggestions.length > 0 ? `
          <div class="section">
            <h2>Coaching Cues (${suggestions.length} cues)</h2>
            ${suggestions.map((suggestion) => `
              <div class="entry suggestion">
                <div class="entry-header">
                  <span class="speaker">Coaching Cue</span>
                  <span class="time">${suggestion.createdAt?.toDate?.()?.toLocaleTimeString() || ''}</span>
                </div>
                <div class="text">${(suggestion.text || suggestion.content || '').replace(/\n/g, '<br>')}</div>
                ${suggestion.trigger ? `
                  <div class="triggers">
                    ${suggestion.trigger.objection ? '<span class="badge badge-red">Objection</span>' : ''}
                    ${suggestion.trigger.competitor ? '<span class="badge badge-yellow">Competitor</span>' : ''}
                    ${suggestion.trigger.timeline ? '<span class="badge badge-green">Timeline</span>' : ''}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        <div class="footer">
          <p>Exported from GHOST on ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for content to load, then trigger print
  setTimeout(() => {
    printWindow.print();
    // Close window after print dialog is dismissed (or after a delay)
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  }, 250);
};

