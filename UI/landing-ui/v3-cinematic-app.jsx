// V3 — Cinematic: full-bleed photography, copper ember
const { useState, useMemo, useEffect } = React;
const R = window.AUBERGINE;
const IK = window.IK;
const PH = window.placeholder;

function SVG({ html, ...rest }) {
  return <span {...rest} dangerouslySetInnerHTML={{__html: html}} />;
}
function Placeholder({ label, w=1600, h=900, tone="ember", className="", style={} }) {
  return <span className={className} style={style} dangerouslySetInnerHTML={{__html: PH({label, w, h, tone})}} />;
}

// === RAIL ===
function Rail({ active, onChange }) {
  const links = [
    { id:"menu", label:"Menu" },
    { id:"reserve", label:"Reserve" },
    { id:"events", label:"Events" },
    { id:"members", label:"Members" },
  ];
  return (
    <aside className="rail">
      <div className="logo-mark">A</div>
      <div className="rail-nav">
        {links.map(l => (
          <button key={l.id} className={"rail-link" + (active===l.id?" active":"")} onClick={()=>onChange(l.id)}>
            {l.label}
          </button>
        ))}
      </div>
      <div className="rail-foot">
        <span className="dot"></span>
        <span>Cheflogik</span>
      </div>
    </aside>
  );
}

// === TOP BAR ===
function TopBar({ cartCount, onCart, onLogin, loggedIn }) {
  return (
    <div className="topbar">
      <div className="l">
        <span className="where"><span className="dot"></span>Service open · Tonight</span>
        <span style={{fontFamily:"ui-monospace,Menlo,monospace",fontSize:11,color:"var(--ash-2)",letterSpacing:".18em"}}>
          {R.hours[R.todayIndex].day.toUpperCase()} · {R.hours[R.todayIndex].text}
        </span>
        <span style={{fontFamily:"ui-monospace,Menlo,monospace",fontSize:11,color:"var(--muted)",letterSpacing:".18em"}}>
          · {R.phone}
        </span>
      </div>
      <div className="r">
        <span style={{fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--ash-2)",fontWeight:600,marginRight:8}}>
          Tribeca <span style={{color:"var(--muted)",margin:"0 6px"}}>·</span> Red Hook <SVG html={IK.chev(11)} style={{color:"var(--ember)",marginLeft:4}}/>
        </span>
        {loggedIn ? (
          <div style={{display:"flex",alignItems:"center",gap:10,marginRight:4}}>
            <div className="avatar" style={{width:36,height:36,fontSize:13}}>{R.customer.initials}</div>
            <div style={{textAlign:"right",lineHeight:1.1}}>
              <div style={{fontSize:12,color:"var(--ash)",fontWeight:600}}>{R.customer.name.split(" ")[0]}</div>
              <div style={{fontSize:10,color:"var(--ember)",letterSpacing:".22em",fontFamily:"ui-monospace,Menlo,monospace"}}>{R.customer.points.toLocaleString()} PTS</div>
            </div>
          </div>
        ) : (
          <button className="iconbtn" onClick={onLogin}><SVG html={IK.user(15)} /></button>
        )}
        <button className="iconbtn" onClick={onCart}>
          <SVG html={IK.bag(15)} />
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </button>
      </div>
    </div>
  );
}

// === HERO ===
function Hero({ onReserve, onBrowse }) {
  return (
    <section className="hero">
      <div className="bg"><Placeholder label="hero · service at the pass" w={1920} h={1080} tone="ember" /></div>
      <div className="scrim"></div>
      <div className="content">
        <div className="l">
          <div className="eyebrow">{R.cuisine.toUpperCase()} · {R.neighborhood.toUpperCase()}</div>
          <h1>A long dinner.<br/><em>Twelve courses.</em><br/>The waterfront.</h1>
          <div className="lede">
            A counter facing the harbor. Six chapters, slowly, paired with a quiet cellar. Two services a night, twelve seats, no second turn.
          </div>
          <div className="hero-actions">
            <button className="btn-ember" onClick={onReserve}>Reserve a table <SVG html={IK.arrow(12)} /></button>
            <button className="btn-glass" onClick={onBrowse}>Browse the menu</button>
          </div>
        </div>
        <div className="r">
          <div className="hero-card">
            <div>
              <div className="lbl">Tonight's prelude</div>
              <div className="sub">Seven courses · 6:00 pm seating</div>
            </div>
            <div className="v"><b>$185</b></div>
          </div>
          <div className="hero-card">
            <div>
              <div className="lbl">Carte blanche</div>
              <div className="sub">Twelve courses · 8:30 pm seating</div>
            </div>
            <div className="v"><b>$295</b></div>
          </div>
          <div className="hero-card">
            <div>
              <div className="lbl">Availability</div>
              <div className="sub">{R.hours[R.todayIndex].day} · 4 of 12 covers open</div>
            </div>
            <div className="v">★ {R.rating}</div>
          </div>
        </div>
      </div>
      <div className="hero-bottom">
        <div className="marquee">
          <span>Service open · Tue – Sun</span>
          <span className="dot"></span>
          <span>Cellar · 2,143 bottles</span>
          <span className="dot"></span>
          <span>Pastry · Maya Okafor</span>
          <span className="dot"></span>
          <span>Reverb tenant · aubergine-rh</span>
        </div>
        <div>scroll ↓</div>
      </div>
    </section>
  );
}

// === QUICK TABS ===
function QuickTabs({ active, onChange }) {
  const tabs = [
    { id:"menu",    num:"01", name:"Browse the menu", desc:"À LA CARTE · 23 PLATES" },
    { id:"reserve", num:"02", name:"Reserve a table", desc:"BOOKING THROUGH JAN" },
    { id:"events",  num:"03", name:"Salon & events",  desc:"SUNDAY SUPPERS · CHEF'S TABLE" },
    { id:"status",  num:"04", name:"Order status",    desc:"LIVE · MEMBERS ONLY" },
  ];
  return (
    <section className="section" style={{paddingTop:64,paddingBottom:32}}>
      <div className="qtabs">
        {tabs.map(t => (
          <button key={t.id} className={"qtab" + (active===t.id?" active":"")} onClick={()=>onChange(t.id)}>
            <span className="num">— {t.num} —</span>
            <span className="name">{t.name}</span>
            <span className="desc">{t.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

// === INFO SLABS ===
function InfoSlabs() {
  return (
    <section className="section">
      <div className="section-head">
        <div className="l">
          <div className="eyebrow">— Practical —</div>
          <h2>The <em>house</em> at a glance.</h2>
          <div className="lede">When, where, how. The unromantic essentials.</div>
        </div>
        <div className="r">SECTION <b>02</b> · 4 SLABS</div>
      </div>
      <div className="info-slabs">
        <div className="slab w7">
          <div className="lbl">02.1 — Hours · This Week</div>
          <h3>Service runs <em>Tue → Sun</em>.</h3>
          <div className="body">Two seatings nightly. The room turns at 8:30 pm. Bar seats released on the hour.</div>
          <div className="hrs-table">
            {R.hours.map((h,i) => (
              <div key={h.day} className={"row" + (i===R.todayIndex?" today":"")}>
                <span className="day">{h.day}</span>
                <span>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="slab w5">
          <div className="lbl">02.2 — Two Houses</div>
          <h3>Find <em>us</em>.</h3>
          <div className="body">Both houses run on Cheflogik. Members carry points between them.</div>
          <div className="branches">
            {R.branches.map(b => (
              <div className="b" key={b.name}>
                <span className="n">{b.name}<span className="nt">{b.note}</span></span>
                <span className="d">{b.distance}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="slab w4">
          <div className="lbl">02.3 — Service</div>
          <h3>At <em>table</em>.</h3>
          <div className="body">Counter, salon, private dining for parties of eight to twelve, and a quiet natural-wine bar.</div>
          <div className="chip-row">
            {R.service.map(s => <span key={s} className="chip">{s}</span>)}
          </div>
        </div>
        <div className="slab w4">
          <div className="lbl">02.4 — Settle Up</div>
          <h3>How to <em>pay</em>.</h3>
          <div className="body">All major cards. Apple Pay at the counter. Service included on tasting menus.</div>
          <div className="chip-row">
            {R.payments.map(p => <span key={p} className="chip">{p}</span>)}
          </div>
        </div>
        <div className="slab w4">
          <div className="lbl">02.5 — Address</div>
          <h3>The <em>door</em>.</h3>
          <div className="body" style={{fontSize:18,color:"var(--ash)",fontWeight:300,lineHeight:1.4}}>
            {R.address}
          </div>
          <div style={{display:"flex",gap:14,marginTop:"auto",alignItems:"center"}}>
            <SVG html={IK.phone(14)} style={{color:"var(--ember)"}} />
            <span style={{fontSize:14,fontWeight:500,color:"var(--ash)"}}>{R.phone}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

// === OFFERS (horizontal scroll) ===
function Offers() {
  return (
    <section className="section" style={{paddingLeft:0,paddingRight:0}}>
      <div className="section-head" style={{padding:"0 64px"}}>
        <div className="l">
          <div className="eyebrow">— Invitations —</div>
          <h2>This <em>season</em>.</h2>
          <div className="lede">Three quiet reasons to come back this autumn.</div>
        </div>
        <div className="r">SECTION <b>03</b> · 3 OFFERS · ← SCROLL →</div>
      </div>
      <div className="h-scroll">
        {R.offers.map((o,i) => (
          <article key={o.title} className="offer">
            <div className="ph"><Placeholder label={o.title} w={840} h={472} tone="ember" /></div>
            <div className="body-pad">
              <div className="tag">— {o.tag} —</div>
              <div className="title">{o.title}</div>
              <div className="desc">{o.body}</div>
              <span className="pill"><SVG html={IK.spark(10)} /> {o.chip}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// === TASTING ===
function Tasting() {
  return (
    <section className="section">
      <div className="section-head">
        <div className="l">
          <div className="eyebrow">— Three Tasting Menus —</div>
          <h2>Chef's <em>tasting</em>.</h2>
          <div className="lede">A prelude, a full carte blanche, and a vegetal counterpart. Pairings drawn from the cellar.</div>
        </div>
        <div className="r">SECTION <b>04</b> · {R.tastingMenus.length} MENUS</div>
      </div>
      <div className="tasting">
        {R.tastingMenus.map((t,i) => (
          <div key={t.name} className={"tcard" + (i===0?" feat":"")}>
            <div className="tag">— Menu {["I","II","III"][i]} —</div>
            <h3>{t.name.split(" ")[0]} <em>{t.name.split(" ").slice(1).join(" ")}</em></h3>
            <div className="pricing">
              <div className="pr">${t.price}</div>
              <div className="lbl">Per guest<br/>Pairing +${t.pairing.replace("+","")}</div>
            </div>
            <div className="meta">
              <div className="r"><span>Courses</span><b>{i===2?"12":i===0?"7":"12"}</b></div>
              <div className="r"><span>Duration</span><b>~ 2h 45m</b></div>
              <div className="r"><span>Reserve</span><b style={{color:"var(--ember)"}}>4 weeks ahead</b></div>
            </div>
            <button className="btn-glass" style={{justifyContent:"center",marginTop:8}}>Reserve <SVG html={IK.arrow(12)} /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

// === FEATURED (horizontal carousel) ===
function getPopular() {
  const all = [];
  R.categories.forEach(c => c.items.forEach(i => { if (i.pop) all.push({...i, cat:c.name}); }));
  return all.slice(0,6);
}
function Featured({ onOpenItem, onAdd }) {
  const pop = useMemo(getPopular, []);
  return (
    <section className="section" style={{paddingLeft:0,paddingRight:0}}>
      <div className="section-head" style={{padding:"0 64px"}}>
        <div className="l">
          <div className="eyebrow">— From The Pass —</div>
          <h2>Featured <em>plates</em>.</h2>
          <div className="lede">Six most-requested by the room this week.</div>
        </div>
        <div className="r">SECTION <b>05</b> · 6 PLATES · ← SCROLL →</div>
      </div>
      <div className="fcards">
        {pop.map(it => (
          <article key={it.id} className="fcard" onClick={()=>onOpenItem(it)}>
            <div className="ph"><Placeholder label={it.name} w={720} h={540} tone="ember" /></div>
            <div className="body">
              <div className="top">
                <span className="cat">— {it.cat} —</span>
              </div>
              <div className="name">{it.name}</div>
              <div className="desc">{it.desc}</div>
              <div className="bottom">
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span className="pr">${it.price}</span>
                  <div className="dietary">{(it.tags||[]).map(t => <span key={t} className="diet">{t}</span>)}</div>
                </div>
                <button className="add-btn" onClick={(e)=>{e.stopPropagation();onAdd(it);}}>
                  <SVG html={IK.plus(10)} /> Add
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// === MENU BROWSE ===
const DIETS = ["VEG","VEGAN","GF"];
function MenuBrowse({ onOpenItem, onAdd }) {
  const [q, setQ] = useState("");
  const [diet, setDiet] = useState(null);
  const [sort, setSort] = useState("default");
  const [active, setActive] = useState(R.categories[0].id);

  function pass(it) {
    if (q && !`${it.name} ${it.desc}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (diet && !(it.tags||[]).includes(diet)) return false;
    return true;
  }
  function sortedItems(items) {
    const arr = items.filter(pass);
    if (sort === "price-asc") return [...arr].sort((a,b)=>a.price-b.price);
    if (sort === "price-desc") return [...arr].sort((a,b)=>b.price-a.price);
    if (sort === "popular") return [...arr].sort((a,b)=>(b.pop?1:0)-(a.pop?1:0));
    return arr;
  }

  return (
    <section className="section" id="menu" data-screen-label="Menu Browse">
      <div className="section-head">
        <div className="l">
          <div className="eyebrow">— À La Carte —</div>
          <h2>The <em>carte</em>.</h2>
          <div className="lede">Six chapters. Search by ingredient or dish; filter by diet; sort however you read.</div>
        </div>
        <div className="r">SECTION <b>06</b> · 23 PLATES · 6 CHAPTERS</div>
      </div>

      <div className="menu-tools">
        <div className="search">
          <SVG html={IK.search(14)} />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Find by dish or ingredient — try ‘scallop’" />
        </div>
        <div className="filter-row">
          {DIETS.map(d => (
            <button key={d} className={"filter" + (diet===d?" active":"")} onClick={()=>setDiet(diet===d?null:d)}>{d}</button>
          ))}
        </div>
        <select className="sort" value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="default">Sort · chef</option>
          <option value="popular">Sort · popular</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
        </select>
      </div>

      <div className="browse">
        <aside className="cat-rail">
          <div className="title">— Chapters —</div>
          {R.categories.map(c => (
            <button
              key={c.id}
              className={"cat-btn" + (active===c.id?" active":"")}
              onClick={()=>{ setActive(c.id); document.getElementById("cat-"+c.id)?.scrollIntoView({block:"start"}); }}
            >
              <span>{c.name}</span>
              <span className="ct">{sortedItems(c.items).length}/{c.items.length}</span>
            </button>
          ))}
        </aside>
        <div>
          {R.categories.map(c => {
            const items = sortedItems(c.items);
            if (items.length === 0) return null;
            return (
              <div key={c.id} id={"cat-"+c.id} className="cat-block" style={{marginBottom:64}}>
                <div className="cat-head">
                  <h3>{c.name}</h3>
                  <div className="sub">— {c.subtitle} —</div>
                </div>
                {items.map(it => (
                  <div
                    key={it.id}
                    className={"item-row" + (it.eightySix?" eightysix":"")}
                    onClick={()=>onOpenItem(it)}
                  >
                    <span className="thumb"><Placeholder label={it.name} w={320} h={320} tone="ember" /></span>
                    <div className="body">
                      <div className="name">
                        {it.name}
                        {it.pop && <span className="pop">POPULAR</span>}
                      </div>
                      <div className="desc">{it.desc}</div>
                      <div className="meta">
                        <div className="dietary">{(it.tags||[]).map(t => <span key={t} className="diet">{t}</span>)}</div>
                        {it.eightySix && (
                          <span className="eta">86’d · {it.eightySix.reason} · back {it.eightySix.eta}</span>
                        )}
                      </div>
                    </div>
                    <div className="side">
                      <div className="price">${it.price}{it.unit ? <span style={{fontSize:11,color:"var(--muted)",letterSpacing:".18em",marginLeft:6,fontWeight:500}}>/ {it.unit}</span> : null}</div>
                      {!it.eightySix && (
                        <button className="add-btn" onClick={(e)=>{e.stopPropagation();onAdd(it);}}>
                          <SVG html={IK.plus(10)} /> Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// === LOYALTY ===
function Loyalty({ loggedIn, onLogin, onAdd }) {
  if (!loggedIn) {
    return (
      <section className="section">
        <div className="loyalty-bg" style={{gridTemplateColumns:"1fr",padding:48,textAlign:"center"}}>
          <div className="loy-l" style={{alignItems:"center"}}>
            <div className="num-eyebrow">— Members —</div>
            <h2 style={{fontSize:56,margin:0,fontWeight:200,letterSpacing:"-.03em"}}>
              The salon <em style={{color:"var(--ember)",fontStyle:"italic"}}>awaits</em>.
            </h2>
            <div style={{color:"var(--ash-2)",maxWidth:520,fontWeight:300}}>
              Earn points on every visit, redeem against the cellar, and unlock the chef's-counter tasting four weeks before the public.
            </div>
            <button className="btn-ember" onClick={onLogin} style={{marginTop:8}}>Sign in <SVG html={IK.arrow(12)} /></button>
          </div>
        </div>
      </section>
    );
  }
  const c = R.customer;
  const pct = Math.min(100, Math.round(c.points / c.nextTier.at * 100));
  return (
    <section className="section">
      <div className="section-head">
        <div className="l">
          <div className="eyebrow">— Members Salon —</div>
          <h2>For <em>{c.name.split(" ")[0].toLowerCase()}</em>.</h2>
          <div className="lede">Your balance, your favorites, and the easiest reorder in Brooklyn.</div>
        </div>
        <div className="r">SECTION <b>07</b> · MEMBERS · {c.tier.toUpperCase()}</div>
      </div>
      <div className="loyalty-bg">
        <div className="loy-l">
          <div className="num-eyebrow">07.1 — Balance</div>
          <div className="loy-top">
            <div className="avatar">{c.initials}</div>
            <div>
              <div className="greet">Bonsoir, <em>{c.name.split(" ")[0]}</em>.</div>
              <div className="tier">{c.tier} member · since 2022 · 19 visits</div>
            </div>
          </div>
          <div className="loy-pts">
            <div className="big">{c.points.toLocaleString()}</div>
            <div className="info">
              <div className="lbl">Points balance</div>
              <div className="next">→ {(c.nextTier.at - c.points).toLocaleString()} to {c.nextTier.name}</div>
            </div>
          </div>
          <div>
            <div className="progress"><div className="bar" style={{width:pct+"%"}}/></div>
            <div className="progress-meta">
              <span>{c.tier}</span>
              <span>{c.nextTier.name}</span>
            </div>
          </div>
          <div style={{marginTop:8}}>
            <div className="num-eyebrow" style={{marginBottom:14}}>07.2 — Your favorites</div>
            <div className="fav-row">
              {c.favorites.map(f => <span key={f} className="f"><SVG html={IK.heart(11)} /> {f}</span>)}
            </div>
          </div>
        </div>
        <div className="loy-r">
          <h4>07.3 — Reorder · the usual</h4>
          <div className="reord">
            {c.lastOrders.map(o => (
              <div key={o.name} className="reord-row">
                <div>
                  <div className="n">{o.name}</div>
                  <div className="w">— {o.when} —</div>
                </div>
                <div className="r">
                  <span className="pr">${o.price}</span>
                  <button onClick={()=>onAdd({name:o.name,price:o.price,id:o.name})}>Reorder</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{padding:"18px",background:"rgba(217,137,60,.06)",border:"1px dashed var(--ember-deep)",marginTop:"auto"}}>
            <div style={{fontSize:11,letterSpacing:".32em",textTransform:"uppercase",color:"var(--ember)",fontWeight:700,marginBottom:6}}>
              — Sommelier's Table —
            </div>
            <div style={{fontSize:14,color:"var(--ash)",fontWeight:300,lineHeight:1.5}}>
              Redeem 6,000 points for a private wine pairing dinner for two.
            </div>
            <div style={{fontSize:11,color:"var(--ember)",marginTop:6,letterSpacing:".22em",textTransform:"uppercase",fontWeight:700}}>
              {(6000 - c.points).toLocaleString()} pts to unlock
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// === FOOTER ===
function Foot() {
  return (
    <footer>
      <div className="top">
        <div>
          <div className="wm">Aubergi<em>n</em>e</div>
          <div className="tag">A house of twelve courses · {R.neighborhood}</div>
        </div>
        <div>
          <h5>Visit</h5>
          <ul>
            <li>{R.address}</li>
            <li>{R.phone}</li>
            <li>Reservations · Tue – Sun</li>
          </ul>
        </div>
        <div>
          <h5>The carte</h5>
          <ul>
            <li>Tasting menus</li>
            <li>À la carte</li>
            <li>Wine pairing</li>
            <li>Private events</li>
          </ul>
        </div>
        <div>
          <h5>House</h5>
          <ul>
            <li>About the chef</li>
            <li>Press</li>
            <li>Salon membership</li>
            <li>Careers</li>
          </ul>
        </div>
      </div>
      <div className="copyright">
        <span>© Aubergine 2024</span>
        <span>cheflogik tenant · aubergine-rh</span>
      </div>
    </footer>
  );
}

// === DRAWER ===
function CartDrawer({ open, onClose, cart, onInc, onDec }) {
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  return (
    <>
      <div className={"scrim" + (open?" show":"")} onClick={onClose} />
      <aside className={"drawer" + (open?" show":"")}>
        <div className="head">
          <h3>Your cart</h3>
          <button className="iconbtn" onClick={onClose}><SVG html={IK.close(14)} /></button>
        </div>
        <div className="body">
          {cart.length === 0 ? (
            <div className="empty">
              <div className="big">Empty for now.</div>
              <div style={{fontFamily:"ui-monospace,Menlo,monospace",fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--muted)"}}>— add a plate from the carte —</div>
            </div>
          ) : (
            cart.map(line => (
              <div key={line.id} className="cart-line">
                <span className="th"><Placeholder label={line.name} w={120} h={120} tone="ember" /></span>
                <div>
                  <div className="n">{line.name}</div>
                  <div className="qty">
                    <button className="qbtn" onClick={()=>onDec(line.id)}><SVG html={IK.minus(10)} /></button>
                    <span style={{minWidth:18,textAlign:"center"}}>{line.qty}</span>
                    <button className="qbtn" onClick={()=>onInc(line.id)}><SVG html={IK.plus(10)} /></button>
                  </div>
                </div>
                <div className="pr">${(line.price*line.qty).toFixed(0)}</div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="foot">
            <div className="tot">
              <div className="lbl">Total<br/>incl. service</div>
              <div className="v">${total.toFixed(0)}</div>
            </div>
            <button className="btn-ember ckbtn">Checkout <SVG html={IK.arrow(12)} /></button>
            <div style={{textAlign:"center",fontFamily:"ui-monospace,Menlo,monospace",fontSize:10,letterSpacing:".22em",color:"var(--muted)",textTransform:"uppercase",fontWeight:600}}>
              checkout flow not yet enabled · display only
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// === ITEM MODAL ===
function ItemModal({ item, onClose, onAdd }) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("Standard");
  const [pair, setPair] = useState(null);
  useEffect(() => { setQty(1); setSize("Standard"); setPair(null); }, [item]);
  if (!item) return null;
  return (
    <div className={"modal show"} onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="card">
        <div className="ph">
          <Placeholder label={item.name} w={800} h={1000} tone="ember" />
          <button className="iconbtn close" onClick={onClose}><SVG html={IK.close(14)} /></button>
        </div>
        <div className="right">
          <div style={{fontSize:10,letterSpacing:".42em",textTransform:"uppercase",color:"var(--ember)",fontWeight:700}}>— Plate —</div>
          <h2>{item.name}</h2>
          <div className="price-big">${item.price}</div>
          <div className="desc">{item.desc}</div>
          {item.allergens && (
            <div style={{fontFamily:"ui-monospace,Menlo,monospace",fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--muted)"}}>
              Contains · {item.allergens.join(" · ")}
            </div>
          )}
          <div className="dietary">{(item.tags||[]).map(t => <span key={t} className="diet">{t}</span>)}</div>

          <div className="opt-group">
            <h5>— Size —</h5>
            {["Half portion","Standard","Sharing for two (+$14)"].map(s => (
              <div key={s} className={"opt-row" + (size===s?" sel":"")} onClick={()=>setSize(s)}>
                <span className="opt-name"><span className="rad" />{s}</span>
                <span className="opt-pr">{s.includes("Half") ? "-$8" : s.includes("Sharing") ? "+$14" : "—"}</span>
              </div>
            ))}
          </div>

          <div className="opt-group">
            <h5>— Wine Pairing —</h5>
            {[
              {n:"None — still water, thank you", p:0},
              {n:"By the glass — sommelier's pick", p:24},
              {n:"Half pour — flight portion", p:14},
            ].map(o => (
              <div key={o.n} className={"opt-row" + (pair===o.n?" sel":"")} onClick={()=>setPair(o.n)}>
                <span className="opt-name"><span className="rad" />{o.n}</span>
                <span className="opt-pr">{o.p ? "+$"+o.p : "—"}</span>
              </div>
            ))}
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:20,borderTop:"1px solid var(--divider)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <button className="qbtn" onClick={()=>setQty(Math.max(1,qty-1))}><SVG html={IK.minus(11)} /></button>
              <span style={{minWidth:24,textAlign:"center",fontSize:20,color:"var(--ash)",fontFeatureSettings:'"tnum"',fontWeight:300}}>{qty}</span>
              <button className="qbtn" onClick={()=>setQty(qty+1)}><SVG html={IK.plus(11)} /></button>
            </div>
            <button className="btn-ember" onClick={()=>{ for(let i=0;i<qty;i++) onAdd(item); onClose(); }}>
              Add — ${(item.price*qty).toFixed(0)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// === LOGIN MODAL ===
function LoginModal({ open, onClose, onLogin }) {
  const [step, setStep] = useState(1);
  const [tenant, setTenant] = useState("aubergine-rh");
  useEffect(() => { if (!open) setStep(1); }, [open]);
  return (
    <div className={"modal" + (open?" show":"")} onClick={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="login-card">
        {step === 1 ? (
          <>
            <div style={{fontSize:10,letterSpacing:".42em",textTransform:"uppercase",color:"var(--ember)",fontWeight:700,marginBottom:8}}>— Sign in · step 01/02 —</div>
            <h2>Welcome back.</h2>
            <div className="sub">Sign in for loyalty, reservations, and reorder.</div>
            <label>Email</label>
            <input defaultValue="eleanor@vance.studio" />
            <label>Password</label>
            <input type="password" defaultValue="••••••••••••" />
            <button className="btn-ember" style={{width:"100%",padding:16,justifyContent:"center"}} onClick={()=>setStep(2)}>
              Continue → choose house
            </button>
            <div style={{textAlign:"center",marginTop:18,fontSize:11,letterSpacing:".22em",textTransform:"uppercase",color:"var(--muted)",fontWeight:700}}>
              or <a style={{color:"var(--ember)"}} href="#">create account</a>
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:10,letterSpacing:".42em",textTransform:"uppercase",color:"var(--ember)",fontWeight:700,marginBottom:8}}>— Sign in · step 02/02 —</div>
            <h2>Choose a house.</h2>
            <div className="sub">Your account spans both Aubergine houses.</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
              {R.branches.map((b,i) => {
                const id = i === 0 ? "aubergine-rh" : "aubergine-tribeca";
                return (
                  <div key={id} className={"tenant" + (tenant===id?" sel":"")} onClick={()=>setTenant(id)}>
                    <div>
                      <div className="n">{b.name}</div>
                      <div className="meta" style={{fontFamily:"ui-monospace,Menlo,monospace",fontSize:11,letterSpacing:".18em",color:"var(--muted)",marginTop:4}}>tenant_id · {id}</div>
                    </div>
                    <SVG html={IK.chev(14)} style={{color:"var(--ember)"}} />
                  </div>
                );
              })}
            </div>
            <button className="btn-ember" style={{width:"100%",padding:16,justifyContent:"center"}} onClick={onLogin}>
              Enter aubergine
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Toast({ msg }) {
  return <div className={"toast" + (msg?" show":"")}><span className="dot" />{msg || "—"}</div>;
}

// === APP ===
function App() {
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(true);
  const [activeTab, setActiveTab] = useState("menu");
  const [toast, setToast] = useState("");
  const [railActive, setRailActive] = useState("menu");

  function add(it) {
    setCart(prev => {
      const ex = prev.find(p => p.id === it.id);
      if (ex) return prev.map(p => p.id === it.id ? {...p, qty: p.qty+1} : p);
      return [...prev, { id: it.id, name: it.name, price: it.price, qty: 1 }];
    });
    setToast(`Added · ${it.name}`);
    setTimeout(() => setToast(""), 1800);
  }
  function inc(id){ setCart(c => c.map(p => p.id===id?{...p,qty:p.qty+1}:p)); }
  function dec(id){ setCart(c => c.map(p => p.id===id?{...p,qty:p.qty-1}:p).filter(p=>p.qty>0)); }
  function scrollToMenu(){ document.getElementById("menu")?.scrollIntoView({behavior:"smooth"}); setRailActive("menu"); }

  return (
    <div className="app">
      <Rail active={railActive} onChange={(id)=>{ setRailActive(id); if(id==="menu") scrollToMenu(); else if(id==="members") setLoginOpen(true); }} />
      <div>
        <TopBar cartCount={cart.reduce((s,i)=>s+i.qty,0)} onCart={()=>setCartOpen(true)} onLogin={()=>setLoginOpen(true)} loggedIn={loggedIn} />
        <Hero onReserve={()=>setLoginOpen(true)} onBrowse={scrollToMenu} />
        <QuickTabs active={activeTab} onChange={(id)=>{ setActiveTab(id); if(id==="menu") scrollToMenu(); }} />
        <InfoSlabs />
        <Offers />
        <Tasting />
        <Featured onOpenItem={setOpenItem} onAdd={add} />
        <MenuBrowse onOpenItem={setOpenItem} onAdd={add} />
        <Loyalty loggedIn={loggedIn} onLogin={()=>setLoginOpen(true)} onAdd={add} />
        <Foot />
      </div>
      <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} cart={cart} onInc={inc} onDec={dec} />
      <ItemModal item={openItem} onClose={()=>setOpenItem(null)} onAdd={add} />
      <LoginModal open={loginOpen} onClose={()=>setLoginOpen(false)} onLogin={()=>{ setLoggedIn(true); setLoginOpen(false); setToast("Signed in"); setTimeout(()=>setToast(""),1800); }} />
      <Toast msg={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
