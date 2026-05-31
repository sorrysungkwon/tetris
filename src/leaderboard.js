import { S, LS, SUPPORT_URL, SPRINT_LINES, fmtTime } from './shared.js';
import { unlockAchievement } from './ui.js';
import { showStartScreen } from './screens.js';

export function _openDonation(){
  if(!SUPPORT_URL)return;
  if(document.getElementById('donation-modal')) return;
  const modal=document.createElement('div');
  modal.id='donation-modal';
  modal.innerHTML=`
    <div class="donation-modal-box">
      <div class="donation-coffee">☕</div>
      <div class="donation-title">SUPPORT GLOWTRIS</div>
      <div class="donation-desc">Opens Ko-fi in a new tab.</div>
      <div class="donation-buttons">
        <button onclick="document.getElementById('donation-modal').remove()" class="donation-btn cancel">CANCEL</button>
        <a href="${SUPPORT_URL}" target="_blank" rel="noopener noreferrer"
          onclick="document.getElementById('donation-modal').remove()" class="donation-btn open">OPEN ↗</a>
      </div>
    </div>`;
  modal.addEventListener('click',e=>{if(e.target===modal)modal.remove();});
  document.body.appendChild(modal);
  setTimeout(() => { const btn = modal.querySelector('.cancel'); if(btn) btn.focus(); }, 10);
}

export function _donationHTML(){
  if(!SUPPORT_URL)return'';
  return`<div class="donation-footer-wrap">
    <button onclick="_openDonation()" class="coffee-btn">☕ BUY ME A COFFEE</button>
    <div class="coffee-sub">keeps glowtris 100% ad-free</div>
  </div>`;
}

export async function submitSprintScore(timeMs){
  const inp=document.getElementById('lb-name');
  const res=document.getElementById('lb-result');
  const btn=document.getElementById('lb-submit-btn');
  if(!inp||!res||!btn)return;
  if(btn.disabled)return;
  const name=inp.value.trim();
  if(!name){inp.focus();return;}
  localStorage.setItem(LS.NAME,name);
  btn.disabled=true;inp.disabled=true;
  res.innerHTML='<div class="sub">SUBMITTING...</div>';
  try{
    const r=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,score:timeMs,mode:'sprint'})});
    const data=await r.json();
    if(data.sprintBoard){
      S._lbCache={...S._lbCache,sprintBoard:data.sprintBoard||[],sprintDailyBoard:data.sprintDailyBoard||[],sprintWeeklyBoard:data.sprintWeeklyBoard||[],sprintRank:data.sprintRank,sprintDailyRank:data.sprintDailyRank,sprintWeeklyRank:data.sprintWeeklyRank,myName:name,mySprintTime:timeMs};
      const rankMsg=[
        data.sprintDailyRank?`<div class="sub" style="color:#00ff88;margin-bottom:2px">TODAY: #${data.sprintDailyRank}</div>`:'',
        data.sprintWeeklyRank?`<div class="sub" style="color:#00c8ff;margin-bottom:2px">WEEKLY: #${data.sprintWeeklyRank}</div>`:'',
        data.sprintRank?`<div class="sub" style="color:#ffe600;margin-bottom:6px">ALL TIME: #${data.sprintRank}</div>`:'',
      ].join('');
      inp.style.display='none';btn.closest('.btn-row').style.display='none';
      const tabs=`<div class="lb-tabs">
        <button class="lb-tab active" data-tab="sprint-daily" onclick="renderLbTab('sprint-daily')">TODAY</button>
        <button class="lb-tab" data-tab="sprint-weekly" onclick="renderLbTab('sprint-weekly')">WEEKLY</button>
        <button class="lb-tab" data-tab="sprint-all" onclick="renderLbTab('sprint-all')">ALL TIME</button>
      </div><div class="lb-inner">${lbHTML(data.sprintDailyBoard||[],name,data.sprintDailyRank,timeMs,true)}</div>`;
      res.innerHTML=rankMsg+tabs+`<div class="btn-row"><button class="action-btn sm ghost" onclick="shareSprintScore(${timeMs},${data.sprintRank||0})">SHARE</button><button class="action-btn sm" onclick="showStartScreen()">PLAY AGAIN</button></div>`+_donationHTML();
    }else{
      btn.disabled=false;inp.disabled=false;
      res.innerHTML='<div class="sub">Save failed — please try again</div>';
    }
  }catch(e){
    btn.disabled=false;inp.disabled=false;
    res.innerHTML='<div class="sub">Network error — please try again</div>';
  }
}

export async function shareSprintScore(timeMs,rank){
  const btn=event&&event.target?event.target:null;
  if(btn){btn.disabled=true;btn.textContent='GENERATING...';}
  try{
    const lpm=Math.round(SPRINT_LINES/(timeMs/60000));
    const rankStr=rank?` — Rank #${rank}`:'';
    const text=`⚡ Glowtris Sprint — ${fmtTime(timeMs)} (${lpm} LPM)${rankStr}\nCan you beat it? ${window.location.origin}`;
    const blob=await captureSprintImage(timeMs,rank,lpm);
    const file=new File([blob],'glowtris-sprint.png',{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({title:'Glowtris Sprint',text,files:[file]});
    }else{
      try{
        await navigator.clipboard.write([new ClipboardItem({'image/png':blob,'text/plain':new Blob([text],{type:'text/plain'})})]);
        alert('Image & Time copied to clipboard!');
      }catch(e){await navigator.clipboard.writeText(text);alert('Sprint time copied to clipboard!');}
    }
  }catch(e){console.error(e);}
  if(btn){btn.disabled=false;btn.textContent='SHARE';}
}

export async function captureSprintImage(timeMs,rank,lpm){
  const c=document.createElement('canvas');
  c.width=1200;c.height=630;
  const ctx=c.getContext('2d');
  ctx.fillStyle='#04041e';ctx.fillRect(0,0,1200,630);
  const bgi=document.getElementById('bg-canvas');
  if(bgi)ctx.drawImage(bgi,0,0,1200,630);
  const gci=document.getElementById('game-canvas');
  if(gci){
    const gw=260,gh=520,gx=90,gy=55;
    ctx.shadowColor='#00ff88';ctx.shadowBlur=40;
    ctx.fillStyle='rgba(0,0,20,0.8)';ctx.fillRect(gx,gy,gw,gh);
    ctx.shadowBlur=0;ctx.drawImage(gci,gx,gy,gw,gh);
    ctx.strokeStyle='#00ff88';ctx.lineWidth=4;ctx.strokeRect(gx,gy,gw,gh);
    ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=1;ctx.strokeRect(gx+2,gy+2,gw-4,gh-4);
  }
  const px=420,py=55,pw=700,ph=520;
  ctx.fillStyle='rgba(4,4,30,0.75)';ctx.shadowColor='rgba(0,0,0,0.6)';ctx.shadowBlur=30;
  ctx.fillRect(px,py,pw,ph);ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(0,255,136,0.35)';ctx.lineWidth=2;ctx.strokeRect(px,py,pw,ph);
  ctx.textAlign='center';
  ctx.fillStyle='#00ff88';ctx.font='900 52px Orbitron, monospace';
  ctx.shadowColor='rgba(0,255,136,0.6)';ctx.shadowBlur=20;
  ctx.fillText('SPRINT 40L',px+pw/2,py+95);ctx.shadowBlur=0;
  ctx.font='700 28px Orbitron, monospace';ctx.fillStyle='rgba(255,255,255,0.6)';
  ctx.letterSpacing='6px';ctx.fillText('FINISH TIME',px+pw/2,py+210);
  ctx.font='900 70px Orbitron, monospace';ctx.fillStyle='#ffe600';
  ctx.shadowColor='#ffe600';ctx.shadowBlur=25;ctx.letterSpacing='2px';
  ctx.fillText(fmtTime(timeMs),px+pw/2,py+290);ctx.shadowBlur=0;
  ctx.fillStyle='rgba(0,255,136,0.2)';ctx.fillRect(px+80,py+320,pw-160,2);
  ctx.letterSpacing='2px';ctx.font='700 26px Orbitron, monospace';
  let cy=py+395;
  if(rank){
    ctx.fillStyle='#00ff88';ctx.shadowColor='rgba(0,255,136,0.5)';ctx.shadowBlur=10;
    ctx.fillText('🏆 ALL TIME RANK: #'+rank,px+pw/2,cy);ctx.shadowBlur=0;cy+=50;
  }
  ctx.fillStyle='#00c8ff';ctx.fillText(`${lpm} LPM   |   40 LINES`,px+pw/2,cy);cy+=50;
  ctx.fillStyle='rgba(255,255,255,0.35)';ctx.font='700 20px Orbitron, monospace';
  ctx.fillText('Can you beat it? glowtris.com',px+pw/2,cy+10);
  return new Promise(res=>c.toBlob(res,'image/png'));
}

export function lbHTML(entries, myName, myRank, myScore, timeMode=false) {
  if(!entries.length) return '<div class="sub" style="margin-top:4px">No records yet</div>';
  const medals=['🥇','🥈','🥉'];
  const fmt=timeMode?(v=>fmtTime(v)):(v=>v.toLocaleString());
  let html = `<table class="lb-table">${entries.map((e,i)=>{
    const isMe=myName&&e.name===myName;
    return `<tr class="${isMe?'lb-me':''}"><td>${medals[i]||i+1}</td><td>${e.name}</td><td>${fmt(e.score)}</td></tr>`;
  }).join('')}`;

  if (myRank && myRank > entries.length && myName && myScore !== undefined) {
    html += `<tr><td colspan="3" style="text-align:center;opacity:0.4;padding:2px 0">...</td></tr>`;
    html += `<tr class="lb-me"><td>${myRank}</td><td>${myName}</td><td>${fmt(myScore)}</td></tr>`;
  }

  html += `</table>`;
  return html;
}

export async function submitScore(){
  const inp=document.getElementById('lb-name');
  const res=document.getElementById('lb-result');
  const btn=document.getElementById('lb-submit-btn');
  if(!inp||!res||!btn)return;
  if(btn.disabled)return;
  const name=inp.value.trim();
  if(!name){inp.focus();return;}
  localStorage.setItem(LS.NAME,name);

  btn.disabled=true; inp.disabled=true;
  res.innerHTML='<div class="sub">SUBMITTING...</div>';

  try{
    const payload = { name, score:S.score };
    if (S.isDailyMode) payload.mode = 'daily';

    const r=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await r.json();

    unlockAchievement('submit_lb');

    if(S.isDailyMode && data.challengeBoard){
      S._lbCache = {
        ...S._lbCache,
        challengeBoard: data.challengeBoard || [],
        challengeRank: data.challengeRank || 0,
        challengeAlltimeBoard: data.challengeAlltimeBoard || [],
        challengeAlltimeRank: data.challengeAlltimeRank || 0,
        myName: name, myScore: S.score
      };

      const rankMsg = `
        <div class="sub" style="color:#ffe600;margin-bottom:2px">TODAY: #${data.challengeRank}</div>
        <div class="sub" style="color:#00c8ff;margin-bottom:6px">ALL TIME: #${data.challengeAlltimeRank}</div>`;
      inp.style.display='none';
      btn.closest('.btn-row').style.display='none';
      const tabs=`<div class="lb-tabs">
        <button class="lb-tab active" data-tab="challenge" onclick="renderLbTab('challenge')">TODAY</button>
        <button class="lb-tab" data-tab="challenge-all" onclick="renderLbTab('challenge-all')">ALL TIME</button>
      </div><div class="lb-inner">${lbHTML(data.challengeBoard||[], name, data.challengeRank, S.score)}</div>`;
      res.innerHTML=rankMsg+tabs+`<div class="btn-row"><button class="action-btn sm ghost" onclick="shareScore(${S.score},${data.challengeRank||0})">SHARE</button><button class="action-btn sm" onclick="showStartScreen()">PLAY AGAIN</button></div>`+_donationHTML();
    }
    else if(data.board){
      S._lbCache = {
        ...S._lbCache,
        board: data.board, dailyBoard: data.dailyBoard || [], weeklyBoard: data.weeklyBoard || [],
        rank: data.rank, dailyRank: data.dailyRank, weeklyRank: data.weeklyRank,
        myName: name, myScore: S.score
      };

      const rankMsg=[
        data.dailyRank?`<div class="sub" style="color:#00ff88;margin-bottom:2px">TODAY: #${data.dailyRank}</div>`:'',
        data.weeklyRank?`<div class="sub" style="color:#00c8ff;margin-bottom:2px">WEEKLY: #${data.weeklyRank}</div>`:'',
        data.rank?`<div class="sub" style="color:#ffe600;margin-bottom:6px">ALL TIME: #${data.rank}</div>`:'',
      ].join('');
      inp.style.display='none';
      btn.closest('.btn-row').style.display='none';
      const tabs=`<div class="lb-tabs">
        <button class="lb-tab active" data-tab="daily" onclick="renderLbTab('daily')">TODAY</button>
        <button class="lb-tab" data-tab="weekly" onclick="renderLbTab('weekly')">WEEKLY</button>
        <button class="lb-tab" data-tab="all" onclick="renderLbTab('all')">ALL TIME</button>
      </div><div class="lb-inner">${lbHTML(data.dailyBoard||[], name, data.dailyRank, S.score)}</div>`;
      res.innerHTML=rankMsg+tabs+`<div class="btn-row"><button class="action-btn sm ghost" onclick="shareScore(${S.score},${data.rank||0})">SHARE</button><button class="action-btn sm" onclick="showStartScreen()">PLAY AGAIN</button></div>`+_donationHTML();
    }else{
      btn.disabled=false;inp.disabled=false;
      res.innerHTML='<div class="sub">Save failed — please try again</div>';
    }
  }catch(e){
    btn.disabled=false;inp.disabled=false;
    res.innerHTML='<div class="sub">Network error — please try again</div>';
  }
}

export async function captureGameImage(sc, rank, isDaily=false) {
  const c = document.createElement('canvas');
  c.width = 1200; c.height = 630;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#04041e';
  ctx.fillRect(0, 0, 1200, 630);

  const bgi = document.getElementById('bg-canvas');
  if(bgi) ctx.drawImage(bgi, 0, 0, 1200, 630);

  const gci = document.getElementById('game-canvas');
  if(gci) {
    const gw = 260, gh = 520;
    const gx = 90, gy = 55;
    ctx.shadowColor = '#00c8ff';
    ctx.shadowBlur = 40;
    ctx.fillStyle = 'rgba(0,0,20,0.8)';
    ctx.fillRect(gx, gy, gw, gh);
    ctx.shadowBlur = 0;
    ctx.drawImage(gci, gx, gy, gw, gh);
    ctx.strokeStyle = '#00c8ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx+2, gy+2, gw-4, gh-4);
  }

  const px = 420, py = 55, pw = 700, ph = 520;
  ctx.fillStyle = 'rgba(4,4,30,0.75)';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 30;
  ctx.fillRect(px, py, pw, ph);
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(0,200,255,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);

  ctx.textAlign = 'center';

  if (isDaily) {
    ctx.fillStyle = '#ffe600';
    ctx.font = '900 52px Orbitron, monospace';
    ctx.shadowColor = 'rgba(255,230,0,0.6)';
    ctx.shadowBlur = 20;
    ctx.letterSpacing = '2px';
    ctx.fillText('DAILY CHALLENGE', px + pw/2, py + 95);
    const todayLabel = new Date().toISOString().slice(0,10);
    ctx.font = '700 22px Orbitron, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.letterSpacing = '4px';
    ctx.fillText(todayLabel, px + pw/2, py + 140);
    ctx.shadowBlur = 0;
  } else {
    const gr = ctx.createLinearGradient(px, py, px+pw, py);
    gr.addColorStop(0, '#00c8ff');
    gr.addColorStop(0.5, '#a000ff');
    gr.addColorStop(1, '#ff0080');
    ctx.fillStyle = gr;
    ctx.font = '900 76px Orbitron, monospace';
    ctx.shadowColor = 'rgba(160,0,255,0.6)';
    ctx.shadowBlur = 20;
    ctx.fillText('GLOWTRIS', px + pw/2, py + 110);
    ctx.shadowBlur = 0;
  }

  ctx.font = '700 28px Orbitron, monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.letterSpacing = '6px';
  ctx.fillText('FINAL SCORE', px + pw/2, py + 210);

  ctx.font = '900 70px Orbitron, monospace';
  ctx.fillStyle = '#ffe600';
  ctx.shadowColor = '#ffe600';
  ctx.shadowBlur = 25;
  ctx.letterSpacing = '2px';
  ctx.fillText(sc.toLocaleString(), px + pw/2, py + 290);
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(0,200,255,0.2)';
  ctx.fillRect(px + 80, py + 340, pw - 160, 2);

  ctx.font = '700 26px Orbitron, monospace';
  ctx.letterSpacing = '2px';

  let currentY = py + 400;
  if (isDaily && rank) {
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = 'rgba(0,255,136,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('🏆 TODAY CHALLENGE RANK: #' + rank, px + pw/2, currentY);
    ctx.shadowBlur = 0;
    currentY += 50;
  } else if (rank) {
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = 'rgba(0,255,136,0.5)';
    ctx.shadowBlur = 10;
    ctx.fillText('🏆 ALL TIME RANK: #' + rank, px + pw/2, currentY);
    ctx.shadowBlur = 0;
    currentY += 50;
  }

  ctx.fillStyle = '#00c8ff';
  ctx.fillText(`LEVEL: ${S.level}   |   LINES: ${S.lines}`, px + pw/2, currentY);
  currentY += 50;

  const maxCombo = parseInt(localStorage.getItem(LS.MAX_COMBO) || '0');
  if (maxCombo > 1) {
    ctx.fillStyle = '#ff0080';
    ctx.fillText(`⚡ MAX COMBO: x${maxCombo}`, px + pw/2, currentY);
  }

  return new Promise(res => c.toBlob(res, 'image/png'));
}

export async function shareScore(sc,rank){
  const btn = event && event.target ? event.target : null;
  if(btn){btn.disabled=true; btn.textContent='GENERATING...';}
  try {
    const isChallenge = S.isDailyMode;
    const rankStr=rank?` — Rank #${rank}`:'';
    const challengeHeader = isChallenge ? `🏆 Glowtris Daily Challenge — ` : `🎮 Glowtris — `;
    const text=`${challengeHeader}${sc.toLocaleString()} pts${rankStr}\n${window.location.origin}`;
    const blob = await captureGameImage(sc, rank, isChallenge);
    const file = new File([blob], 'glowtris-score.png', {type: 'image/png'});

    if(navigator.canShare && navigator.canShare({files: [file]})) {
      await navigator.share({title:'Glowtris', text, files: [file]});
    } else {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
            'text/plain': new Blob([text], {type: 'text/plain'})
          })
        ]);
        alert('Image & Score copied to clipboard!');
      } catch(e) {
        await navigator.clipboard.writeText(text);
        alert('Score text copied to clipboard!');
      }
    }
  } catch(e) {
    console.error(e);
  }
  if(btn){btn.disabled=false; btn.textContent='SHARE';}
}

export async function loadStartLeaderboard(){
  const el=document.getElementById('start-lb');
  if(!el)return;
  try{
    const url=S.lbMode==='daily'?'/api/leaderboard?mode=daily'
             :S.lbMode==='sprint'?'/api/leaderboard?mode=sprint'
             :'/api/leaderboard';
    const r=await fetch(url);
    const data=await r.json();
    S._lbCache={...S._lbCache,...data};
    const activeTab=document.querySelector('.lb-tab[data-tab].active');
    const defaultTab=S.lbMode==='daily'?'challenge':S.lbMode==='sprint'?'sprint-daily':'daily';
    renderLbTab(activeTab?activeTab.dataset.tab:defaultTab);
  }catch(e){}
}

export function renderLbTab(tab){
  const inner=document.querySelector('.lb-inner');
  if(!inner)return;
  let entries, myRank;
  const isSprintTab=tab.startsWith('sprint');
  if(tab==='daily')            { entries=S._lbCache.dailyBoard||[];            myRank=S._lbCache.dailyRank; }
  else if(tab==='weekly')      { entries=S._lbCache.weeklyBoard||[];           myRank=S._lbCache.weeklyRank; }
  else if(tab==='challenge')   { entries=S._lbCache.challengeBoard||[];        myRank=S._lbCache.challengeRank; }
  else if(tab==='challenge-all'){entries=S._lbCache.challengeAlltimeBoard||[];myRank=S._lbCache.challengeAlltimeRank;}
  else if(tab==='sprint-daily'){ entries=S._lbCache.sprintDailyBoard||[];     myRank=S._lbCache.sprintDailyRank; }
  else if(tab==='sprint-weekly'){entries=S._lbCache.sprintWeeklyBoard||[];    myRank=S._lbCache.sprintWeeklyRank; }
  else if(tab==='sprint-all')  { entries=S._lbCache.sprintBoard||[];          myRank=S._lbCache.sprintRank; }
  else                         { entries=S._lbCache.board||[];                myRank=S._lbCache.rank; }

  document.querySelectorAll('.lb-tab[data-tab]').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  const myVal=isSprintTab?S._lbCache.mySprintTime:S._lbCache.myScore;
  inner.innerHTML=lbHTML(entries,S._lbCache.myName,myRank,myVal,isSprintTab);
}

export function setLbMode(mode) {
  S.lbMode=mode;
  ['marathon','sprint','daily'].forEach(m=>{
    const el=document.getElementById('lb-mode-'+m);
    if(el)el.classList.toggle('active',m===mode);
  });

  const tc=document.querySelector('.lb-tabs-container');
  if(tc){
    if(mode==='daily'){
      tc.innerHTML=`
        <button class="lb-tab active" data-tab="challenge" onclick="renderLbTab('challenge')">TODAY</button>
        <button class="lb-tab" data-tab="challenge-all" onclick="renderLbTab('challenge-all')">ALL TIME</button>
      `;
    }else if(mode==='sprint'){
      tc.innerHTML=`
        <button class="lb-tab active" data-tab="sprint-daily" onclick="renderLbTab('sprint-daily')">TODAY</button>
        <button class="lb-tab" data-tab="sprint-weekly" onclick="renderLbTab('sprint-weekly')">WEEKLY</button>
        <button class="lb-tab" data-tab="sprint-all" onclick="renderLbTab('sprint-all')">ALL TIME</button>
      `;
    }else{
      tc.innerHTML=`
        <button class="lb-tab active" data-tab="daily" onclick="renderLbTab('daily')">TODAY</button>
        <button class="lb-tab" data-tab="weekly" onclick="renderLbTab('weekly')">WEEKLY</button>
        <button class="lb-tab" data-tab="all" onclick="renderLbTab('all')">ALL TIME</button>
      `;
    }
  }
  loadStartLeaderboard();
}
