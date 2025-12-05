import{c as R,r as j,g as Q,d as z,e as U,q as O,o as P,l as H,u as W,i as X,j as e,h as q,X as Y,Z as V,B as E,k as _,m as J}from"./index-zowQoAB2.js";import{F as K}from"./file-text-BX-Lw-t1.js";import{T as ee}from"./trash-2-D6oIrGYN.js";/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=R("FileSpreadsheet",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M8 13h2",key:"yr2amv"}],["path",{d:"M14 13h2",key:"un5t4a"}],["path",{d:"M8 17h2",key:"2yhykz"}],["path",{d:"M14 17h2",key:"10kma7"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=R("Lock",[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]]);/**
 * @license lucide-react v0.453.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const G=R("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]),te=({userId:n,enabled:b=!0})=>{const[o,a]=j.useState([]),[C,r]=j.useState(!1),[t,c]=j.useState(null),[i,v]=j.useState(0);return j.useEffect(()=>{if(!b||!n){a([]),r(!1);return}(async()=>{r(!0),c(null);try{const l=Q();if(!l){r(!1);return}const f=z(l,"users",n,"sessions"),y=await U(f);console.log("[useSessionList] Found sessions:",y.size);const g=await Promise.all(y.docs.map(async d=>{var h,M,N,T;const x=d.id,m=d.data();try{const $=z(l,"users",n,"sessions",x,"transcript"),s=O($,P("createdAt","desc"),H(1)),k=await U(s),u=z(l,"users",n,"sessions",x,"suggestions"),D=O(u,P("createdAt","desc"),H(1)),S=await U(D);let A=null;if(!k.empty){const L=k.docs[0].data();A=((M=(h=L.createdAt)==null?void 0:h.toDate)==null?void 0:M.call(h))||L.createdAt||null}if(!S.empty){const L=S.docs[0].data(),F=((T=(N=L.createdAt)==null?void 0:N.toDate)==null?void 0:T.call(N))||L.createdAt||null;(!A||F&&F>A)&&(A=F)}const I=k.empty?0:"?",Z=S.empty?0:"?";return{id:x,...m,lastActivity:A,transcriptCount:I,suggestionsCount:Z}}catch($){return console.warn(`Error fetching metadata for session ${x}:`,$),{id:x,...m,lastActivity:null,transcriptCount:0,suggestionsCount:0}}}));g.sort((d,x)=>!d.lastActivity&&!x.lastActivity?0:d.lastActivity?x.lastActivity?x.lastActivity.getTime()-d.lastActivity.getTime():-1:1),a(g)}catch(l){console.error("Error fetching sessions:",l),c(l.message)}finally{r(!1)}})()},[n,b,i]),{sessions:o,isLoading:C,error:t,refresh:()=>{v(p=>p+1)}}},ae=({session:n,transcript:b=[],suggestions:o=[]})=>{if(!n){console.error("Cannot export: session data is missing");return}const a=[];a.push("GHOST Session Export"),a.push(`Session ID: ${n.id||"Unknown"}`),a.push(`Date: ${n.lastActivity?new Date(n.lastActivity).toLocaleString():"Unknown"}`),a.push(`Mode: ${n.mode||"sales"}`),a.push(""),b.length>0&&(a.push("=== TRANSCRIPT ==="),a.push("Speaker,Time,Text"),b.forEach(i=>{var l,f,y;const v=(i.speaker||"Unknown").replace(/,/g,";"),w=i.time||((y=(f=(l=i.createdAt)==null?void 0:l.toDate)==null?void 0:f.call(l))==null?void 0:y.toLocaleTimeString())||"",p=(i.text||i.content||"").replace(/,/g,";").replace(/\n/g," ");a.push(`"${v}","${w}","${p}"`)}),a.push("")),o.length>0&&(a.push("=== COACHING CUES ==="),a.push("Time,Text,Triggers"),o.forEach(i=>{var f,y,g,d,x,m;const v=((g=(y=(f=i.createdAt)==null?void 0:f.toDate)==null?void 0:y.call(f))==null?void 0:g.toLocaleTimeString())||"",w=(i.text||i.content||"").replace(/,/g,";").replace(/\n/g," "),p=[];(d=i.trigger)!=null&&d.objection&&p.push("Objection"),(x=i.trigger)!=null&&x.competitor&&p.push("Competitor"),(m=i.trigger)!=null&&m.timeline&&p.push("Timeline");const l=p.join("; ")||"None";a.push(`"${v}","${w}","${l}"`)}));const C=a.join(`
`),r=new Blob([C],{type:"text/csv;charset=utf-8;"}),t=document.createElement("a"),c=URL.createObjectURL(r);t.setAttribute("href",c),t.setAttribute("download",`ghost-session-${n.id.substring(0,8)}-${new Date().toISOString().split("T")[0]}.csv`),t.style.visibility="hidden",document.body.appendChild(t),t.click(),document.body.removeChild(t),URL.revokeObjectURL(c)},re=({session:n,transcript:b=[],suggestions:o=[]})=>{if(!n){console.error("Cannot export: session data is missing");return}const a=window.open("","_blank");if(!a){alert("Please allow popups to export as PDF");return}const C=`
    <!DOCTYPE html>
    <html>
      <head>
        <title>GHOST Session Export - ${n.id.substring(0,8)}</title>
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
            <span><strong>Session ID:</strong> ${n.id}</span>
            <span><strong>Date:</strong> ${n.lastActivity?new Date(n.lastActivity).toLocaleString():"Unknown"}</span>
            <span><strong>Mode:</strong> ${n.mode||"sales"}</span>
          </div>
        </div>
        
        ${b.length>0?`
          <div class="section">
            <h2>Transcript (${b.length} messages)</h2>
            ${b.map(r=>{var t,c,i;return`
              <div class="entry">
                <div class="entry-header">
                  <span class="speaker">${r.speaker||"Unknown"}</span>
                  <span class="time">${r.time||((i=(c=(t=r.createdAt)==null?void 0:t.toDate)==null?void 0:c.call(t))==null?void 0:i.toLocaleTimeString())||""}</span>
                </div>
                <div class="text">${(r.text||r.content||"").replace(/\n/g,"<br>")}</div>
              </div>
            `}).join("")}
          </div>
        `:""}
        
        ${o.length>0?`
          <div class="section">
            <h2>Coaching Cues (${o.length} cues)</h2>
            ${o.map(r=>{var t,c,i;return`
              <div class="entry suggestion">
                <div class="entry-header">
                  <span class="speaker">Coaching Cue</span>
                  <span class="time">${((i=(c=(t=r.createdAt)==null?void 0:t.toDate)==null?void 0:c.call(t))==null?void 0:i.toLocaleTimeString())||""}</span>
                </div>
                <div class="text">${(r.text||r.content||"").replace(/\n/g,"<br>")}</div>
                ${r.trigger?`
                  <div class="triggers">
                    ${r.trigger.objection?'<span class="badge badge-red">Objection</span>':""}
                    ${r.trigger.competitor?'<span class="badge badge-yellow">Competitor</span>':""}
                    ${r.trigger.timeline?'<span class="badge badge-green">Timeline</span>':""}
                  </div>
                `:""}
              </div>
            `}).join("")}
          </div>
        `:""}
        
        <div class="footer">
          <p>Exported from GHOST on ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `;a.document.write(C),a.document.close(),setTimeout(()=>{a.print(),setTimeout(()=>{a.close()},1e3)},250)},oe=({isOpen:n,onClose:b,userId:o,planDetails:a,canExportSessions:C,onUpgradeClick:r})=>{const[t,c]=j.useState(null),[i,v]=j.useState(!1),[w,p]=j.useState(!1),{sessions:l,isLoading:f,refresh:y}=te({userId:o,enabled:n&&!!o}),{playbackLimit:g}=W(a),d=j.useMemo(()=>g===null?l:l.slice(0,g),[l,g]),x=j.useMemo(()=>g===null?!1:l.length>g,[l.length,g]),{transcript:m,suggestions:h,isLoading:M}=X({userId:o,sessionId:t,enabled:!!t&&!!o});if(!n)return null;const N=d.find(s=>s.id===t),T=s=>s?s instanceof Date?s.toLocaleString():new Date(s).toLocaleString():"Unknown",$=async()=>{if(!(!t||!o)){p(!0);try{await J({userId:o,sessionId:t}),c(null),v(!1),y()}catch(s){console.error("Failed to delete session:",s),alert("Failed to delete session. Please try again.")}finally{p(!1)}}};return e.jsxs("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm",children:[e.jsxs("div",{className:"bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col m-4",children:[e.jsxs("div",{className:"flex items-center justify-between p-6 border-b border-gray-800",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(q,{className:"w-6 h-6 text-blue-400"}),e.jsx("h2",{className:"text-2xl font-bold text-gray-100",children:"Session Replay"})]}),e.jsx("button",{onClick:b,className:"p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors",children:e.jsx(Y,{className:"w-5 h-5"})})]}),e.jsxs("div",{className:"flex-1 overflow-hidden flex",children:[e.jsx("div",{className:"w-80 border-r border-gray-800 overflow-y-auto bg-gray-950/50",children:e.jsxs("div",{className:"p-4",children:[e.jsx("h3",{className:"text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4",children:"Past Sessions"}),f?e.jsx("div",{className:"text-center py-8 text-gray-500",children:"Loading sessions..."}):d.length===0?e.jsxs("div",{className:"text-center py-8 text-gray-500",children:[e.jsx("p",{className:"text-sm",children:"No sessions found"}),e.jsx("p",{className:"text-xs mt-2 text-gray-600",children:"Start a session to see replays here"})]}):e.jsxs("div",{className:"space-y-2",children:[x&&e.jsx("div",{className:"mb-3 p-3 rounded-lg border border-yellow-800/50 bg-yellow-900/10",children:e.jsxs("div",{className:"flex items-start gap-2",children:[e.jsx(B,{className:"w-4 h-4 text-yellow-400 mt-0.5 shrink-0"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("p",{className:"text-xs font-medium text-yellow-300",children:["Showing ",d.length," of ",l.length," sessions"]}),e.jsx("p",{className:"text-xs text-yellow-400/70 mt-1",children:"Upgrade to view all past sessions"}),r&&e.jsx("button",{onClick:r,className:"mt-2 text-xs text-yellow-300 hover:text-yellow-200 underline",children:"Upgrade plan →"})]})]})}),d.map((s,k)=>e.jsxs("button",{onClick:()=>c(s.id),className:`w-full text-left p-3 rounded-lg border transition-all ${t===s.id?"border-blue-500 bg-blue-500/10":"border-gray-800 hover:border-gray-700 bg-gray-900/50 hover:bg-gray-900"}`,children:[e.jsx("div",{className:"flex items-start justify-between gap-2",children:e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("div",{className:"text-xs text-gray-400 mb-1",children:T(s.lastActivity)}),e.jsxs("div",{className:"text-sm font-medium text-gray-200 truncate",children:["Session ",s.id.substring(0,8)]})]})}),e.jsxs("div",{className:"flex items-center gap-3 mt-2 text-xs text-gray-500",children:[e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(G,{className:"w-3 h-3"}),s.transcriptCount==="?"?"...":s.transcriptCount||0]}),e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(V,{className:"w-3 h-3"}),s.suggestionsCount==="?"?"...":s.suggestionsCount||0]})]})]},s.id))]})]})}),e.jsx("div",{className:"flex-1 flex flex-col overflow-hidden",children:t?e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"p-4 border-b border-gray-800 bg-gray-950/50",children:e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsxs("h3",{className:"text-lg font-semibold text-gray-100",children:["Session ",N.id.substring(0,8)]}),e.jsx("div",{className:"flex items-center gap-4 mt-1 text-xs text-gray-400",children:e.jsx("span",{children:T(N.lastActivity)})})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs(E,{color:"blue",className:"text-xs",children:[m.length," messages"]}),e.jsxs(E,{color:"yellow",className:"text-xs",children:[h.length," cues"]})]}),e.jsxs("div",{className:"flex items-center gap-2 border-l border-gray-800 pl-3",children:[(m.length>0||h.length>0)&&e.jsx(e.Fragment,{children:C?e.jsxs(e.Fragment,{children:[e.jsxs("button",{onClick:()=>ae({session:N,transcript:m,suggestions:h}),className:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors text-xs",title:"Export as CSV",children:[e.jsx(se,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"hidden sm:inline",children:"CSV"})]}),e.jsxs("button",{onClick:()=>re({session:N,transcript:m,suggestions:h}),className:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors text-xs",title:"Export as PDF",children:[e.jsx(K,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"hidden sm:inline",children:"PDF"})]})]}):e.jsxs("button",{onClick:r,className:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-yellow-700/50 hover:border-yellow-600 bg-yellow-900/20 hover:bg-yellow-900/30 text-yellow-300 hover:text-yellow-200 transition-colors text-xs",title:"Upgrade to export sessions",children:[e.jsx(B,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"hidden sm:inline",children:"Export (Upgrade)"})]})}),e.jsxs("button",{onClick:()=>v(!0),className:"flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-700/50 hover:border-red-600 bg-red-900/20 hover:bg-red-900/30 text-red-300 hover:text-red-200 transition-colors text-xs",title:"Delete session",disabled:w,children:[e.jsx(ee,{className:"w-3.5 h-3.5"}),e.jsx("span",{className:"hidden sm:inline",children:"Delete"})]})]})]})]})}),e.jsx("div",{className:"flex-1 overflow-y-auto p-4 space-y-4",children:M?e.jsx("div",{className:"text-center py-8 text-gray-500",children:"Loading session data..."}):e.jsxs(e.Fragment,{children:[m.length>0&&e.jsxs("div",{children:[e.jsxs("h4",{className:"text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2",children:[e.jsx(G,{className:"w-4 h-4"}),"Transcript"]}),e.jsx("div",{className:"space-y-2",children:m.map((s,k)=>{var u,D,S;return e.jsxs("div",{className:"p-3 rounded-lg border border-gray-800 bg-gray-900/50",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2 mb-1",children:[e.jsx("span",{className:"text-xs font-medium text-blue-400",children:s.speaker||"Unknown"}),e.jsx("span",{className:"text-xs text-gray-500",children:s.time||((S=(D=(u=s.createdAt)==null?void 0:u.toDate)==null?void 0:D.call(u))==null?void 0:S.toLocaleTimeString())||""})]}),e.jsx("p",{className:"text-sm text-gray-200",children:s.text||s.content})]},s.id||k)})})]}),h.length>0&&e.jsxs("div",{children:[e.jsxs("h4",{className:"text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2",children:[e.jsx(V,{className:"w-4 h-4"}),"Coaching Cues"]}),e.jsx("div",{className:"space-y-2",children:h.map((s,k)=>{var u,D,S;return e.jsxs("div",{className:"p-3 rounded-lg border-l-4 border-blue-500 bg-blue-950/10",children:[e.jsxs("div",{className:"flex items-start justify-between gap-2 mb-1",children:[e.jsx("span",{className:"text-xs font-medium text-blue-400",children:"Coaching Cue"}),e.jsx("span",{className:"text-xs text-gray-500",children:((S=(D=(u=s.createdAt)==null?void 0:u.toDate)==null?void 0:D.call(u))==null?void 0:S.toLocaleTimeString())||""})]}),e.jsx("p",{className:"text-sm text-blue-100 font-medium",children:s.text||s.content}),s.trigger&&e.jsxs("div",{className:"flex items-center gap-2 mt-2",children:[s.trigger.objection&&e.jsx(E,{color:"red",className:"text-[10px]",children:"Objection"}),s.trigger.competitor&&e.jsx(E,{color:"yellow",className:"text-[10px]",children:"Competitor"}),s.trigger.timeline&&e.jsx(E,{color:"green",className:"text-[10px]",children:"Timeline"})]})]},s.id||k)})})]}),m.length===0&&h.length===0&&e.jsx("div",{className:"text-center py-8 text-gray-500",children:e.jsx("p",{className:"text-sm",children:"No data available for this session"})})]})})]}):e.jsx("div",{className:"flex-1 flex items-center justify-center text-gray-500",children:e.jsxs("div",{className:"text-center",children:[e.jsx(q,{className:"w-12 h-12 mx-auto mb-4 text-gray-700"}),e.jsx("p",{className:"text-sm",children:"Select a session to view replay"})]})})})]})]}),i&&e.jsx("div",{className:"fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm",children:e.jsx("div",{className:"bg-gray-900 border border-red-800/50 rounded-2xl shadow-2xl max-w-md w-full m-4 p-6",children:e.jsxs("div",{className:"flex items-start gap-4",children:[e.jsx("div",{className:"flex-shrink-0 w-12 h-12 rounded-full bg-red-900/20 flex items-center justify-center",children:e.jsx(_,{className:"w-6 h-6 text-red-400"})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h3",{className:"text-lg font-semibold text-gray-100 mb-2",children:"Delete Session?"}),e.jsx("p",{className:"text-sm text-gray-400 mb-4",children:"This will permanently delete this session and all its data (transcripts and coaching cues). This action cannot be undone."}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{onClick:$,disabled:w,className:"flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",children:w?"Deleting...":"Delete Session"}),e.jsx("button",{onClick:()=>v(!1),disabled:w,className:"px-4 py-2 rounded-lg border border-gray-700 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800 text-gray-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed",children:"Cancel"})]})]})]})})})]})};export{oe as SessionReplayModal};
