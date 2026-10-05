
(function(w){





var _0xbga=null,_0xsne=!1;
function _0xiae(){
if(!_0xbga){
_0xbga=new Audio('casino_music.wav');
_0xbga.loop=!0;
_0xbga.volume=0.3;
_0xbga.preload='auto';
}
}
function _0xdbgm(){
if(!_0xbga||_0xbga.paused)return;
try{
_0xbga.volume=0.08;
setTimeout(function(){if(!_0xbga.paused)_0xbga.volume=0.3;},500);
}catch(_0xe){}
}
function _0xpcs(){
if(!_0xsne)return;
_0xdbgm();
try{
var _0xctx=new(window.AudioContext||window.webkitAudioContext)();
var _0xosc=_0xctx.createOscillator(),_0xgn=_0xctx.createGain();
_0xosc.type='sine';_0xosc.frequency.setValueAtTime(900,_0xctx.currentTime);
_0xosc.frequency.exponentialRampToValueAtTime(250,_0xctx.currentTime+0.04);
_0xgn.gain.setValueAtTime(0.18,_0xctx.currentTime);
_0xgn.gain.exponentialRampToValueAtTime(0.001,_0xctx.currentTime+0.04);
_0xosc.connect(_0xgn);_0xgn.connect(_0xctx.destination);
_0xosc.start();_0xosc.stop(_0xctx.currentTime+0.04);
}catch(_0xe){}
}
function _0xpcards(){
if(!_0xsne)return;
_0xdbgm();
try{
var _0xctx=new(window.AudioContext||window.webkitAudioContext)();
var _0xbs=_0xctx.sampleRate*0.07;
var _0xbuf=_0xctx.createBuffer(1,_0xbs,_0xctx.sampleRate);
var _0xdata=_0xbuf.getChannelData(0);for(var _0xi=0;_0xi<_0xbs;_0xi++)_0xdata[_0xi]=Math.random()*2-1;
var _0xns=_0xctx.createBufferSource();_0xns.buffer=_0xbuf;
var _0xflt=_0xctx.createBiquadFilter();_0xflt.type='bandpass';_0xflt.frequency.value=1400;
var _0xgn=_0xctx.createGain();_0xgn.gain.setValueAtTime(0.12,_0xctx.currentTime);
_0xgn.gain.exponentialRampToValueAtTime(0.001,_0xctx.currentTime+0.07);
_0xns.connect(_0xflt);_0xflt.connect(_0xgn);_0xgn.connect(_0xctx.destination);
_0xns.start();
}catch(_0xe){}
}
function _0xpws(){
if(!_0xsne)return;
_0xdbgm();
try{
var _0xctx=new(window.AudioContext||window.webkitAudioContext)();
var _0xnow=_0xctx.currentTime;
[523.25,659.25,783.99,1046.50].forEach(function(_0xf,_0xidx){
var _0xosc=_0xctx.createOscillator(),_0xgn=_0xctx.createGain();
_0xosc.type='triangle';_0xosc.frequency.setValueAtTime(_0xf,_0xnow+_0xidx*0.08);
_0xgn.gain.setValueAtTime(0.1,_0xnow+_0xidx*0.08);
_0xgn.gain.exponentialRampToValueAtTime(0.001,_0xnow+_0xidx*0.08+0.35);
_0xosc.connect(_0xgn);_0xgn.connect(_0xctx.destination);
_0xosc.start(_0xnow+_0xidx*0.08);_0xosc.stop(_0xnow+_0xidx*0.08+0.35);
});
}catch(_0xe){}
}
w.toggleAudio=function(){
_0xiae();
if(_0xbga.paused){
_0xbga.play().then(function(){
_0xsne=!0;
w.showNotification('Casino Music (.wav) & SFX Enabled');
}).catch(function(_0xerr){
w.showNotification('Audio blocked. Tap again!');
});
}else{
_0xbga.pause();
_0xsne=!1;
w.showNotification('Audio Disabled');
}
};
w.showNotification=function(txt,isErr){
var old=document.getElementById('game-toast-badge');if(old)old.remove();
var el=document.createElement('div');el.id='game-toast-badge';
el.className='game-notification-toast '+(isErr?'error':'success');
var cleanTxt=String(txt||'').split('\n').join('<br>');
el.innerHTML=cleanTxt+'<div style="font-size:0.65rem;color:#94a3b8;margin-top:3px;font-weight:normal;">(Tap to dismiss)</div>';
el.onclick=function(){el.style.animation='toastOut 0.25s ease forwards';setTimeout(()=>el.remove(),250);};
document.body.appendChild(el);
setTimeout(function(){if(el.parentElement){el.style.animation='toastOut 0.25s ease forwards';setTimeout(()=>el.remove(),250);}},4500);
};

var _0x5a1b=['https://api.calmchessgames.com','register','login','active','rule-item valid','rule-item invalid','block','none','flex','auth-alert error','auth-alert success','calmchess_bank_','/logout.php','/admin_api.php?action=get_mode','/admin_api.php?action=set_mode','/admin_api.php?action=buy_credits','/admin_api.php?action=sync_bank','/paypal_api.php?action=create_order','/paypal_api.php?action=capture_order','/register.php','/login.php','POST','application/json','include','selected','cards-row','hand-box','hand-box active','card hidden','card red','card black','busted','stood','playing'];
var _0x5a1b=['https://api.calmchessgames.com','register','login','active','rule-item valid','rule-item invalid','block','none','flex','auth-alert error','auth-alert success','calmchess_bank_','/logout.php','/admin_api.php?action=get_mode','/admin_api.php?action=set_mode','/admin_api.php?action=buy_credits','/admin_api.php?action=sync_bank','/paypal_api.php?action=create_order','/paypal_api.php?action=capture_order','/register.php','/login.php','POST','application/json','include','selected','cards-row','hand-box','hand-box active','card hidden','card red','card black','busted','stood','playing'];
function _0x1f(idx){return _0x5a1b[idx];}
var _0xapi=_0x1f(0);
var _0xcm=_0x1f(1),_0xsc=1000,_0xsp=4.99,_0xsim=!0,_0xppr=!1,_0xins=0,_0xinr=null,_0xsh=[];
var _0xttc=0,_0xttt=null,_0xcuid=null,_0cuem='',_0xdeck=[],_0xdh=[],_0xph=[],_0xccp=0,_0xccr=!1;
var _0xahi=0,_0xbnk=500,_0xibt=0,_0xgov=!0;

var _0xbEl=document.getElementById('bank-display'),_0xwEl=document.getElementById('bet-display'),
_0xsEl=document.getElementById('shoe-display'),_0xcEl=document.getElementById('cut-display'),
_0xmEl=document.getElementById('message-banner'),_0xdsEl=document.getElementById('dealer-score'),
_0xdcEl=document.getElementById('dealer-cards'),_0xhcEl=document.getElementById('player-hands-container'),
_0xdb=document.getElementById('deal-btn'),_0xhb=document.getElementById('hit-btn'),
_0xsb=document.getElementById('stand-btn'),_0xddb=document.getElementById('double-btn'),
_0xspb=document.getElementById('split-btn'),_0xcc=document.getElementById('chip-controls');

w.checkPasswordRules=function(_0xv){
var _0xs=(_0xv||'').toString(),_0xst=function(_0xi,_0xvld){var _0xe=document.getElementById(_0xi);if(_0xe)_0xe.className=_0xvld?_0x1f(4):_0x1f(5);};
_0xst('r-len',_0xs.length>=8);_0xst('r-up',/[A-Z]/.test(_0xs));_0xst('r-low',/[a-z]/.test(_0xs));_0xst('r-num',/[0-9]/.test(_0xs));_0xst('r-spec',/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(_0xs));
};

w.switchAuthTab=function(_0xm){
_0xcm=_0xm;
document.getElementById('tab-reg').classList.toggle(_0x1f(3),_0xm===_0x1f(1));
document.getElementById('tab-login').classList.toggle(_0x1f(3),_0xm===_0x1f(2));
document.getElementById('password-rules').style.display=(_0xm===_0x1f(1))?_0x1f(8):_0x1f(7);
document.getElementById('auth-submit-btn').textContent=(_0xm===_0x1f(1))?'Register & Play':'Sign In';
var _0xil=document.getElementById('auth-id-label'),_0xii=document.getElementById('auth-identifier');
if(_0xm===_0x1f(1)){_0xil.textContent='Email Address';_0xii.placeholder='email';}
else{_0xil.textContent='Username or Email';_0xii.placeholder='username or email';}
_0xha();
};

function _0xsa(_0xtxt,_0xisErr){
var _0xe=document.getElementById('auth-alert');
_0xe.textContent=_0xtxt;_0xe.className=_0xisErr?_0x1f(9):_0x1f(10);_0xe.style.display=_0x1f(6);
}
function _0xha(){document.getElementById('auth-alert').style.display=_0x1f(7);}

async function _0xsyb(_0xtb){
var _0xbv=Math.max(0,parseFloat(_0xtb)||0);
try{if(_0xcuid)localStorage.setItem(_0x1f(11)+_0xcuid,_0xbv.toFixed(2));}catch(_0xe){}
try{
await fetch(_0xapi+_0x1f(16),{method:_0x1f(21),headers:{'Content-Type':_0x1f(22)},credentials:_0x1f(23),keepalive:!0,body:JSON.stringify({user_id:_0xcuid,email:_0cuem,bank:_0xbv})});
}catch(_0xe){}
}

w.handleAuthSubmit=async function(_0xe){
if(_0xe&&_0xe.preventDefault)_0xe.preventDefault();
_0xha();
var _0xid=document.getElementById('auth-identifier').value.trim();
var _0xpwd=document.getElementById('auth-password').value;
var _0xep=_0xapi+((_0xcm===_0x1f(1))?_0x1f(19):_0x1f(20));
try{
var _0xres=await fetch(_0xep+'?_t='+Date.now(),{method:_0x1f(21),headers:{'Content-Type':_0x1f(22)},credentials:_0x1f(23),body:JSON.stringify({identifier:_0xid,email:_0xid,password:_0xpwd})});
var _0xraw=await _0xres.text();
var _0xdt;try{_0xdt=JSON.parse(_0xraw);}catch(_0xerr){_0xsa('Server Error ('+_0xres.status+'): '+_0xraw.replace(/<[^>]*>?/gm,'').trim(),!0);return;}
if(_0xres.status===409||(_0xdt&&(_0xdt.error_code==='EMAIL_EXISTS'||(_0xdt.message&&_0xdt.message.includes('already registered'))))){
_0xsa(_0xdt.message,!0);w.showNotification(_0xdt.message+'\n\nSwitching to Sign In tab.');w.switchAuthTab('login');
document.getElementById('auth-password').value='';document.getElementById('auth-password').focus();return;
}
if(!_0xdt.success){_0xsa(_0xdt.message,!0);return;}
_0xcuid=_0xdt.user.id;_0cuem=_0xdt.user.email||_0xid;
var _0xstb=parseFloat(_0xdt.user.bank);
document.getElementById('lobby-screen').classList.remove(_0x1f(3));
document.getElementById('game-screen').classList.add(_0x1f(3));
_0xram();_0xinps(_0xstb);
}catch(_0xerr){_0xsa('Network Error: '+_0xerr.message,!0);}
};

w.executeLogout=async function(){
if(_0xgov&&_0xibt>0){_0xbnk+=_0xibt;_0xibt=0;}
await _0xsyb(_0xbnk);
try{await fetch(_0xapi+_0x1f(12)+'?_t='+Date.now(),{method:_0x1f(21),credentials:_0x1f(23),keepalive:!0});}catch(_0xe){}
document.getElementById('game-screen').classList.remove(_0x1f(3));
document.getElementById('lobby-screen').classList.add(_0x1f(3));
document.getElementById('auth-password').value='';
_0xcuid=null;_0cuem='';_0xdeck=[];_0xdh=[];_0xph=[];_0xsh=[];
};

async function _0xram(){
try{
var _0xr=await fetch(_0xapi+_0x1f(13)+'&_t='+Date.now(),{credentials:_0x1f(23)});
var _0xd=await _0xr.json();
if(_0xd.success){_0xsim=_0xd.simulation_mode;_0xusui();}
}catch(_0xe){}
}

function _0xusui(){
document.getElementById('simulation-container').style.display=_0xsim?_0x1f(6):_0x1f(7);
document.getElementById('paypal-live-container').style.display=_0xsim?_0x1f(7):_0x1f(8);
if(!_0xsim)_0xrpp();
}

w.selectPackage=function(_0xc,_0xp,_0xel){
_0xsc=_0xc;_0xsp=_0xp;
document.querySelectorAll('.package-box').forEach(function(_0xb){_0xb.classList.remove(_0x1f(24));});
_0xel.classList.add(_0x1f(24));
document.getElementById('sim-buy-btn').textContent='Add Credits (Simulated $'+_0xp+')';
};

w.openStoreModal=function(){_0xram();document.getElementById('store-modal').classList.add(_0x1f(3));};
w.closeStoreModal=function(){document.getElementById('store-modal').classList.remove(_0x1f(3));};
w.openAdminModal=function(){document.getElementById('admin-sim-toggle').checked=_0xsim;document.getElementById('admin-modal').classList.add(_0x1f(3));};
w.closeAdminModal=function(){document.getElementById('admin-modal').classList.remove(_0x1f(3));};

w.saveAdminSettings=async function(){
var _0xk=document.getElementById('admin-key').value;
var _0xsm=document.getElementById('admin-sim-toggle').checked?1:0;
try{
var _0xr=await fetch(_0xapi+_0x1f(14),{method:_0x1f(21),headers:{'Content-Type':_0x1f(22)},credentials:_0x1f(23),body:JSON.stringify({admin_key:_0xk,enable_simulation:_0xsm})});
var _0xd=await _0xr.json();
if(!_0xd.success){w.showNotification('Admin Error: '+_0xd.message);return;}
_0xsim=_0xd.simulation_mode;
w.showNotification('Simulation mode: '+(_0xsim?'ENABLED':'DISABLED'));
w.closeAdminModal();_0xusui();
}catch(_0xerr){w.showNotification('Connection error: '+_0xerr.message);}
};

w.executeSimulatedPurchase=async function(){
if(!document.getElementById('accept-terms-check').checked){w.showNotification('Please review and check the Terms of Service acceptance box.');return;}
try{
var _0xr=await fetch(_0xapi+_0x1f(15),{method:_0x1f(21),headers:{'Content-Type':_0x1f(22)},credentials:_0x1f(23),body:JSON.stringify({package:_0xsc,user_id:_0xcuid,email:_0cuem})});
var _0xd=await _0xr.json();
if(!_0xd.success){w.showNotification(_0xd.message);return;}
_0xbnk=parseFloat(_0xd.new_bank);_0xbEl.textContent=_0xbnk;
_0xsyb(_0xbnk);
w.showNotification('[SIMULATION]: '+_0xd.message);w.closeStoreModal();
}catch(_0xerr){w.showNotification('Simulation failed: '+_0xerr.message);}
};

function _0xrpp(){
if(_0xppr||typeof paypal==='undefined')return;
paypal.Buttons({
style:{layout:'vertical',color:'gold',shape:'rect',label:'pay'},
onClick:function(_0xd,_0xa){if(!document.getElementById('accept-terms-check').checked){w.showNotification('Accept Terms of Service before continuing.');return _0xa.reject();}return _0xa.resolve();},
createOrder:async function(){
var _0xr=await fetch(_0xapi+_0x1f(17),{method:_0x1f(21),headers:{'Content-Type':_0x1f(22)},credentials:_0x1f(23),body:JSON.stringify({package:_0xsc,user_id:_0xcuid,email:_0cuem})});
var _0xd=await _0xr.json();if(!_0xd.success)throw new Error(_0xd.message);return _0xd.orderID;
},
onApprove:async function(_0xd){
var _0xr=await fetch(_0xapi+_0x1f(18),{method:_0x1f(21),headers:{'Content-Type':_0x1f(22)},credentials:_0x1f(23),body:JSON.stringify({orderID:_0xd.orderID,package:_0xsc,user_id:_0xcuid,email:_0cuem})});
var _0xcp=await _0xr.json();
if(_0xcp.success){_0xbnk=parseFloat(_0xcp.new_bank);_0xbEl.textContent=_0xbnk;_0xsyb(_0xbnk);w.showNotification(_0xcp.message);w.closeStoreModal();}
else{w.showNotification('Capture Error: '+_0xcp.message);}
},
onError:function(_0xe){w.showNotification('Payment error: '+_0xe);}
}).render('#paypal-button-container');
_0xppr=!0;
}

var _0xcanId=null,_0xcpt=[],_0xcto=null;
function _0xtbc(_0xa){_0xpws();
var _0xe=document.getElementById('celebration-overlay');
document.getElementById('celebration-payout').textContent='Won $'+_0xa+' (3:2 Payout)';
_0xe.classList.add(_0x1f(3));_0xscf();
clearTimeout(_0xcto);_0xcto=setTimeout(w.closeBlackjackCelebration,4000);
}
w.closeBlackjackCelebration=function(){document.getElementById('celebration-overlay').classList.remove(_0x1f(3));_0xstcf();clearTimeout(_0xcto);};

function _0xscf(){
var _0xc=document.getElementById('confetti-canvas'),_0xctx=_0xc.getContext('2d');
_0xc.width=window.innerWidth;_0xc.height=window.innerHeight;_0xcpt=[];
var _0xcls=['#f1c40f','#e74c3c','#2ecc71','#3498db','#9b59b6','#ffffff'];
for(var _0xi=0;_0xi<100;_0xi++){
_0xcpt.push({x:Math.random()*_0xc.width,y:Math.random()*_0xc.height-_0xc.height,size:Math.random()*7+3,color:_0xcls[Math.floor(Math.random()*_0xcls.length)],vx:Math.random()*4-2,vy:Math.random()*4+3,rot:Math.random()*360,rotSpeed:Math.random()*8-4});
}
function _0xfrm(){
_0xctx.clearRect(0,0,_0xc.width,_0xc.height);
_0xcpt.forEach(function(_0xp){
_0xp.x+=_0xp.vx;_0xp.y+=_0xp.vy;_0xp.rot+=_0xp.rotSpeed;
if(_0xp.y>_0xc.height){_0xp.y=-10;_0xp.x=Math.random()*_0xc.width;}
_0xctx.save();_0xctx.translate(_0xp.x,_0xp.y);_0xctx.rotate((_0xp.rot*Math.PI)/180);
_0xctx.fillStyle=_0xp.color;_0xctx.fillRect(-_0xp.size/2,-_0xp.size/2,_0xp.size,_0xp.size*1.6);_0xctx.restore();
});
_0xcanId=requestAnimationFrame(_0xfrm);
}
cancelAnimationFrame(_0xcanId);_0xfrm();
}
function _0xstcf(){cancelAnimationFrame(_0xcanId);var _0xc=document.getElementById('confetti-canvas');if(_0xc)_0xc.getContext('2d').clearRect(0,0,_0xc.width,_0xc.height);}

var _0xst=['♠','♥','♦','♣'];
var _0xvl=[{n:'2',v:2},{n:'3',v:3},{n:'4',v:4},{n:'5',v:5},{n:'6',v:6},{n:'7',v:7},{n:'8',v:8},{n:'9',v:9},{n:'10',v:10},{n:'J',v:10},{n:'Q',v:10},{n:'K',v:10},{n:'A',v:11}];
var _0xND=6,_0xMH=4;

function _0xgos(){
var _0xe=document.getElementById('table-seats-input');
var _0xt=_0xe?_0xe.value.trim():'';if(_0xt==='')return 1;
var _0xv=parseInt(_0xt,10);if(isNaN(_0xv)||_0xv<1)return 1;
return _0xv>7?7:_0xv;
}

function _0xechs(){
var _0xd=[];
for(var _0xi=0;_0xi<_0xND;_0xi++){
for(var _0xsi=0;_0xsi<_0xst.length;_0xsi++){
for(var _0xvi=0;_0xvi<_0xvl.length;_0xvi++){_0xd.push({suit:_0xst[_0xsi],name:_0xvl[_0xvi].n,value:_0xvl[_0xvi].v});}
}
}
for(var _0xj=_0xd.length-1;_0xj>0;_0xj--){
var _0xk=Math.floor(Math.random()*(_0xj+1)),_0xtm=_0xd[_0xj];_0xd[_0xj]=_0xd[_0xk];_0xd[_0xk]=_0xtm;
}
var _0xmd=Math.floor(_0xd.length/2),_0xl1=_0xd.slice(0,_0xmd),_0xl2=_0xd.slice(_0xmd),_0xrf=[];
while(_0xl1.length||_0xl2.length){
var _0xc1=Math.min(_0xl1.length,Math.floor(Math.random()*8)+16),_0xc2=Math.min(_0xl2.length,Math.floor(Math.random()*8)+16);
var _0xs1=_0xl1.splice(0,_0xc1),_0xs2=_0xl2.splice(0,_0xc2);
while(_0xs1.length||_0xs2.length){
if(_0xs1.length&&(!_0xs2.length||Math.random()>0.5)){_0xrf.push(_0xs1.pop());}
else if(_0xs2.length){_0xrf.push(_0xs2.pop());}
}
}
var _0xct=Math.floor(Math.random()*80)+116;
_0xdeck=_0xrf.slice(_0xct).concat(_0xrf.slice(0,_0xct));
_0xccp=Math.floor(Math.random()*24)+55;_0xccr=!1;
_0xdeck.pop();
_0xsEl.textContent=_0xdeck.length;_0xcEl.textContent=_0xccp+' cards';
}

function _0xdc(){
if(_0xdeck.length<=_0xccp)_0xccr=!0;
if(_0xdeck.length===0)_0xechs();
var _0xc=_0xdeck.pop();_0xsEl.textContent=_0xdeck.length;return _0xc;
}

function _0xcls(_0xcds){
var _0xsc=0,_0xac=0;
for(var _0xi=0;_0xi<_0xcds.length;_0xi++){_0xsc+=_0xcds[_0xi].value;if(_0xcds[_0xi].name==='A')_0xac++;}
while(_0xsc>21&&_0xac>0){_0xsc-=10;_0xac--;}
return _0xsc;
}

function _0xcce(_0xc,_0xhdn){
var _0xe=document.createElement('div');
if(_0xhdn){_0xe.className='card hidden';return _0xe;}
var _0xclr=(_0xc.suit==='♥'||_0xc.suit==='♦')?'red':'black';
_0xe.className='card '+_0xclr;
_0xe.innerHTML='<div>'+_0xc.name+'</div><div class="suit">'+_0xc.suit+'</div><div class="corner-bottom">'+_0xc.name+'</div>';
return _0xe;
}

function _0xrndb(_0xpk){
if(_0xpk===undefined)_0xpk=!0;
_0xdcEl.innerHTML='';
_0xdh.forEach(function(_0xc,_0xidx){_0xdcEl.appendChild(_0xcce(_0xc,_0xidx===1&&_0xpk&&!_0xgov));});
_0xdsEl.textContent=(_0xpk&&!_0xgov)?(_0xdh[0]?_0xdh[0].value:0):_0xcls(_0xdh);
var _0xts=_0xgos();
_0xhcEl.innerHTML='';
if(_0xts>1&&window.innerWidth>=768){
var _0xcenterIdx=Math.floor(_0xts/2);
var _0xshIdx=0;
for(var _0xsi=0;_0xsi<_0xts;_0xsi++){
var _0xbx=document.createElement('div');
var _0xIsPlayer=(_0xsi===_0xcenterIdx);
var _0xsc=0,_0xcards=[];
if(_0xIsPlayer){
_0xcards=_0xph[0].cards;
_0xsc=_0xcls(_0xcards);
var _0xIsActive=(!_0xgov&&0===_0xahi);
_0xbx.className=_0xIsActive?'hand-box active center-seat':'hand-box center-seat';
var _0xlbl=document.createElement('div');
_0xlbl.className='hand-label';
_0xlbl.innerHTML='Score: <span>'+_0xsc+'</span>';
_0xbx.appendChild(_0xlbl);
if(_0xgov&&_0xph[0]&&_0xph[0].resTxt){
var _0xrb=document.createElement('div');
_0xrb.className='hand-result-badge '+(_0xph[0].resType||'win');
_0xrb.textContent=_0xph[0].resTxt;
_0xbx.style.position='relative';
_0xbx.appendChild(_0xrb);
}
}else{
var _0xseatCards=_0xsh[_0xshIdx]||[];
_0xcards=_0xseatCards;
_0xsc=_0xcls(_0xcards);
_0xbx.className='hand-group';
var _0xlbl=document.createElement('div');
_0xlbl.className='hand-label';
_0xlbl.innerHTML='Score: <span>'+_0xsc+'</span>';
_0xbx.appendChild(_0xlbl);
_0xshIdx++;
}
var _0xrow=document.createElement('div');
_0xrow.className=_0x1f(25);
_0xcards.forEach(function(_0xc){_0xrow.appendChild(_0xcce(_0xc,!1));});
_0xbx.appendChild(_0xrow);
_0xhcEl.appendChild(_0xbx);
}
}else{
_0xph.forEach(function(_0xh,_0xidx){
var _0xsc=_0xcls(_0xh.cards);
var _0xbx=document.createElement('div');
_0xbx.className=(!_0xgov&&_0xidx===_0xahi)?'hand-box active':'hand-box';
var _0xlbl=document.createElement('div');
_0xlbl.className='hand-label';
_0xlbl.innerHTML='Score: <span>'+_0xsc+'</span>';
_0xbx.appendChild(_0xlbl);
if(_0xgov&&_0xh.resTxt){
var _0xrb=document.createElement('div');
_0xrb.className='hand-result-badge '+(_0xh.resType||'win');
_0xrb.textContent=_0xh.resTxt;
_0xbx.style.position='relative';
_0xbx.appendChild(_0xrb);
}
var _0xrow=document.createElement('div');
_0xrow.className=_0x1f(25);
_0xh.cards.forEach(function(_0xc){_0xrow.appendChild(_0xcce(_0xc,!1));});
_0xbx.appendChild(_0xrow);
_0xhcEl.appendChild(_0xbx);
});
}
_0xwEl.textContent=_0xgov?_0xibt:(_0xph.reduce(function(_0xa,_0xb){return _0xa+_0xb.bet;},0)||_0xibt);
_0xbEl.textContent=_0xbnk;
}function _0xinps(_0xub){
_0xbnk=parseFloat(_0xub);_0xibt=0;_0xins=0;_0xgov=!0;
_0xdh=[];_0xph=[];_0xsh=[];
_0xbEl.textContent=_0xbnk;_0xwEl.textContent=0;
_0xmEl.textContent='Place your bet and press DEAL!';
_0xdsEl.textContent='0';_0xdcEl.innerHTML='';_0xhcEl.innerHTML='';
var _0xsi=document.getElementById('table-seats-input');if(_0xsi)_0xsi.value='';
_0xechs();_0xuab();_0xrndb();
}

w.addBet=function(_0xa){_0xpcs();
if(!_0xgov){
_0xdh=[];_0xph=[];_0xsh=[];
_0xdcEl.innerHTML='';_0xhcEl.innerHTML='';_0xdsEl.textContent='0';
_0xgov=!0;
}
if(_0xibt>=500){_0xmEl.textContent='Maximum bet is $500!';return;}
var _0xad=Math.min(_0xa,500-_0xibt);
if(_0xbnk>=_0xad){
_0xbnk-=_0xad;_0xibt+=_0xad;_0xbEl.textContent=_0xbnk;_0xwEl.textContent=_0xibt;
if(_0xibt===500){_0xmEl.textContent='Max bet reached ($500)';}
else{if(_0xmEl.textContent.includes('bet'))_0xmEl.textContent='';}
}
else if(_0xbnk<=0&&_0xibt===0){w.openStoreModal();}
};

w.clearBet=function(){_0xpcs();if(!_0xgov)return;_0xbnk+=_0xibt;_0xibt=0;_0xbEl.textContent=_0xbnk;_0xwEl.textContent=0;_0xmEl.textContent='';};

function _0xuab(){
if(_0xgov){
_0xdb.disabled=!1;_0xhb.disabled=_0xsb.disabled=_0xddb.disabled=_0xspb.disabled=!0;
_0xcc.style.opacity='1';_0xcc.querySelectorAll('.chip, button').forEach(function(_0xb){_0xb.style.pointerEvents='auto';});
return;
}
_0xdb.disabled=!0;_0xcc.style.opacity='0.3';
_0xcc.querySelectorAll('.chip, button').forEach(function(_0xb){_0xb.style.pointerEvents='none';});
var _0xh=_0xph[_0xahi];if(!_0xh)return;
if(_0xh.isSplitAce){_0xhb.disabled=_0xddb.disabled=_0xspb.disabled=!0;_0xsb.disabled=!1;return;}
_0xhb.disabled=_0xsb.disabled=!1;
_0xddb.disabled=!(_0xh.cards.length===2&&_0xbnk>=_0xh.bet);
var _0xpr=(_0xh.cards.length===2&&_0xh.cards[0].value===_0xh.cards[1].value);
var _0xac=(_0xh.cards.length===2&&_0xh.cards[0].name==='A');
_0xspb.disabled=!(_0xph.length<_0xMH&&_0xpr&&_0xbnk>=_0xh.bet&&(!_0xh.isSplitAce||!_0xac));
}

function _0xpmi(){
return new Promise(function(_0xrsv){
_0xinr=_0xrsv;var _0xcst=Math.floor(_0xph[0].bet/2);
document.getElementById('insurance-amount-label').textContent='Insurance Cost: $'+_0xcst;
var _0xyb=document.getElementById('ins-yes-btn');
if(_0xbnk<_0xcst){_0xyb.disabled=!0;_0xyb.textContent='Insufficient Funds';}
else{_0xyb.disabled=!1;_0xyb.textContent='Take Insurance';}
document.getElementById('insurance-modal').classList.add(_0x1f(3));
});
}

w.handleInsuranceChoice=function(_0xc){
document.getElementById('insurance-modal').classList.remove(_0x1f(3));
if(_0xinr){var _0xr=_0xinr;_0xinr=null;_0xr(_0xc);}
};

function _0xsose(){
_0xsh.forEach(function(_0xshd){
while(!0){
var _0xsc=_0xcls(_0xshd),_0xha=_0xshd.some(function(_0xc){return _0xc.name==='A';});
if(_0xsc<17)_0xshd.push(_0xdc());
else if(_0xsc===17&&_0xha)_0xshd.push(_0xdc());
else break;
}
});
}

w.startGame=async function(){_0xpcards();
if(_0xibt===0){if(_0xbnk<=0)w.openStoreModal();else _0xmEl.textContent='Please place a bet first!';return;}
if(_0xccr||_0xdeck.length<=_0xccp){_0xechs();_0xmEl.textContent='Cut card reached! Shoe reshuffled & card burned.';}
else{_0xmEl.textContent='';}
_0xgov=!1;_0xins=0;_0xph=[{cards:[],bet:_0xibt,status:_0x1f(33),isSplitAce:!1}];
_0xibt=0;_0xahi=0;_0xdh=[];_0xsh=[];
var _0xts=_0xgos(),_0xos=_0xts-1;
_0xph[0].cards.push(_0xdc());
for(var _0xs=0;_0xs<_0xos;_0xs++)_0xsh.push([_0xdc()]);
_0xdh.push(_0xdc());
_0xph[0].cards.push(_0xdc());
for(var _0xs2=0;_0xs2<_0xos;_0xs2++)_0xsh[_0xs2].push(_0xdc());
_0xdh.push(_0xdc());
_0xrndb(!0);_0xuab();
var _0xuc=_0xdh[0],_0xdbj=(_0xcls(_0xdh)===21);
if(_0xuc.name==='A'){
var _0xtk=await _0xpmi();
if(_0xtk){var _0xcst=Math.floor(_0xph[0].bet/2);_0xins=_0xcst;_0xbnk-=_0xcst;_0xbEl.textContent=_0xbnk;}
if(_0xdbj){
if(_0xins>0){
var _0xwn=_0xins*3;
_0xbnk+=_0xwn;
_0xbEl.textContent=_0xbnk;
_0xmEl.textContent='Dealer has Blackjack! Insurance pays 2:1 (+$'+(_0xins*2)+').';
if(_0xph[0]){_0xph[0].resTxt='PUSH';_0xph[0].resType='push';}
}else{
_0xmEl.textContent='Dealer has Blackjack!';
if(_0xph[0]){_0xph[0].resTxt='-$'+_0xph[0].bet;_0xph[0].resType='loss';}
}
_0xfnr();return;
}else if(_0xins>0){_0xmEl.textContent='Insurance collected.';}
}else if(_0xuc.value===10){
if(_0xdbj){_0xmEl.textContent='Dealer has Blackjack!';_0xfnr();return;}
}
if(_0xph[0].cards.length===2&&_0xcls(_0xph[0].cards)===21){_0xfnr();}
};

w.playerHit=function(){_0xpcards();
var _0xh=_0xph[_0xahi];_0xh.cards.push(_0xdc());
var _0xsc=_0xcls(_0xh.cards);
if(_0xsc>=21){_0xh.status=(_0xsc>21)?_0x1f(31):_0x1f(32);_0xrndb(!0);_0xnxh();}
else{_0xrndb(!0);_0xuab();}
};

w.playerDouble=function(){
var _0xh=_0xph[_0xahi];_0xbnk-=_0xh.bet;_0xh.bet*=2;
_0xh.cards.push(_0xdc());_0xh.status=(_0xcls(_0xh.cards)>21)?_0x1f(31):_0x1f(32);
_0xrndb(!0);_0xnxh();
};

w.playerSplit=function(){
var _0xh=_0xph[_0xahi];_0xbnk-=_0xh.bet;
var _0xc1=_0xh.cards[0],_0xc2=_0xh.cards[1],_0xisa=(_0xc1.name==='A');
var _0xh1={cards:[_0xc1,_0xdc()],bet:_0xh.bet,status:_0xisa?_0x1f(32):_0x1f(33),isSplitAce:_0xisa};
var _0xh2={cards:[_0xc2,_0xdc()],bet:_0xh.bet,status:_0xisa?_0x1f(32):_0x1f(33),isSplitAce:_0xisa};
_0xph.splice(_0xahi,1,_0xh1,_0xh2);_0xrndb(!0);
if(_0xisa)_0xnxh();else _0xuab();
};

w.playerStand=function(){_0xph[_0xahi].status=_0x1f(32);_0xnxh();};

function _0xnxh(){
var _0xni=_0xph.findIndex(function(_0xh,_0xi){return _0xi>=_0xahi&&_0xh.status===_0x1f(33);});
if(_0xni!==-1){_0xahi=_0xni;_0xrndb(!0);_0xuab();}
else{_0xfnr();}
}

function _0xdsh(_0xhnd){
var _0xsc=0,_0xac=0;
for(var _0xi=0;_0xi<_0xhnd.length;_0xi++){_0xsc+=_0xhnd[_0xi].value;if(_0xhnd[_0xi].name==='A')_0xac++;}
while(_0xsc>21&&_0xac>0){_0xsc-=10;_0xac--;}
if(_0xsc<17)return !0;
if(_0xsc===17&&_0xac>0)return !0;
return !1;
}

function _0xfnr(){
_0xgov=!0;_0xsose();
var _0xdbj=(_0xdh.length===2&&_0xcls(_0xdh)===21);
if(!_0xdbj&&!_0xph.every(function(_0xh){return _0xcls(_0xh.cards)>21;})){
while(_0xdsh(_0xdh)){_0xdh.push(_0xdc());}
}
var _0xdsc=_0xcls(_0xdh),_0xrc=0,_0xwnb=!1,_0xnwa=0;
_0xph.forEach(function(_0xh){
var _0xpsc=_0xcls(_0xh.cards);
var _0xpbj=(_0xh.cards.length===2&&_0xpsc===21&&_0xph.length===1);
if(_0xpsc>21){
_0xh.resTxt='-$'+_0xh.bet;_0xh.resType='loss';
}else if(_0xpbj){
if(_0xdbj){_0xrc+=_0xh.bet;_0xh.resTxt='PUSH';_0xh.resType='push';}
else{var _0xw=Math.floor(_0xh.bet*2.5);_0xrc+=_0xw;_0xwnb=!0;_0xnwa=_0xw;_0xh.resTxt='+$'+Math.floor(_0xh.bet*1.5);_0xh.resType='win';}
}else if(_0xdbj){
_0xh.resTxt='-$'+_0xh.bet;_0xh.resType='loss';
}else if(_0xdsc>21||_0xpsc>_0xdsc){
_0xrc+=_0xh.bet*2;_0xh.resTxt='+$'+_0xh.bet;_0xh.resType='win';
}else if(_0xpsc===_0xdsc){
_0xrc+=_0xh.bet;_0xh.resTxt='PUSH';_0xh.resType='push';
}else{
_0xh.resTxt='-$'+_0xh.bet;_0xh.resType='loss';
}
if(_0xpsc<=21){
if(!_0xpbj&&!_0xdbj){
if(_0xdsc>21||_0xpsc>_0xdsc){}
else if(_0xpsc===_0xdsc){}
}
}
});
_0xbnk+=_0xrc;
var _0xmsg='';
if(_0xdbj){if(_0xins>0)_0xmsg='Dealer has Blackjack! Insurance pays 2:1 (+$'+(_0xins*2)+').';else _0xmsg='Dealer has Blackjack!';}
else{if(_0xins>0)_0xmsg='Insurance collected. ';if(_0xdsc>21)_0xmsg+='Dealer Busted!';}
if(_0xccr){_0xmsg+="<br><span style='color:var(--gold);'>(Cut Card Reached - Reshuffling Next Deal)</span>";}
_0xmEl.innerHTML=_0xmsg;_0xrndb(!1);_0xwEl.textContent=0;_0xuab();_0xsyb(_0xbnk);
if(_0xwnb)_0xtbc(_0xnwa);
if(_0xbnk<=0&&_0xibt===0){_0xmEl.innerHTML+="<br><span style='color:var(--gold);'>Out of credits! Click '+ Credits' to refill.</span>";setTimeout(w.openStoreModal,1200);}
var _0xtotHands=1+_0xsh.length+Math.max(0,_0xph.length-1);
var _0xdynDelay=Math.min(8000,3000+(_0xtotHands*800));
setTimeout(function(){
if(_0xgov){
_0xdh=[];_0xph=[];_0xsh=[];
_0xdcEl.innerHTML='';_0xhcEl.innerHTML='';_0xdsEl.textContent='0';
_0xmEl.textContent='Place your bet and press DEAL!';
}
},_0xdynDelay);
}

document.addEventListener('DOMContentLoaded',function(){
var _0xtt=document.getElementById('table-title');
if(_0xtt){
_0xtt.addEventListener('click',function(){
_0xttc++;clearTimeout(_0xttt);_0xttt=setTimeout(function(){_0xttc=0;},900);
if(_0xttc>=3){_0xttc=0;w.openAdminModal();}
});
}
});
})(window);
