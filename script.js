const $ = id => document.getElementById(id);
const STORAGE = "courierProData";

const defaultData = {
  bookings: [
    {id:1,tracking:"CR-2026-001",sender:"John Smith",receiver:"Sarah Johnson",weight:"2.5 kg",status:"In Transit",amount:250,date:"2026-09-20",location:"Chennai Hub",eta:"2026-09-25"},
    {id:2,tracking:"CR-2026-002",sender:"Amazon",receiver:"Rajesh Kumar",weight:"1.2 kg",status:"Delivered",amount:150,date:"2026-09-19",location:"Coimbatore",eta:"Delivered"},
    {id:3,tracking:"CR-2026-003",sender:"Priya Stores",receiver:"Anitha Devi",weight:"3.0 kg",status:"Out for Delivery",amount:320,date:"2026-09-21",location:"Coimbatore Van",eta:"Today"},
    {id:4,tracking:"CR-2026-004",sender:"Tech World",receiver:"Karthik S",weight:"0.8 kg",status:"Pending",amount:120,date:"2026-09-22",location:"Chennai Hub",eta:"2026-09-26"},
    {id:5,tracking:"CR-2026-005",sender:"Fresh Mart",receiver:"Meena R",weight:"4.2 kg",status:"Delivered",amount:450,date:"2026-09-18",location:"Chennai",eta:"Delivered"}
  ],
  personnel:[
    {id:1,name:"Rahul Sharma",contact:"+91 9876543210",vehicle:"TN-38-AB-1234",route:"Route A",status:"Active"},
    {id:2,name:"Arun Kumar",contact:"+91 9123456780",vehicle:"TN-37-CD-5678",route:"Route B",status:"Active"},
    {id:3,name:"Vijay Raj",contact:"+91 9000012345",vehicle:"TN-39-EF-9012",route:"Route C",status:"Inactive"}
  ],
  routes:[
    {id:1,name:"Route A",area:"Chennai Central",stops:["Chennai Hub","Egmore","T Nagar","Adyar"],personnel:"Rahul Sharma",status:"Active"},
    {id:2,name:"Route B",area:"Coimbatore North",stops:["Coimbatore Hub","Gandhipuram","Saibaba Colony"],personnel:"Arun Kumar",status:"Active"},
    {id:3,name:"Route C",area:"Chennai South",stops:["Guindy","Velachery","Tambaram"],personnel:"Vijay Raj",status:"Planned"}
  ],
  invoices:[
    {id:1,invoice:"INV-1001",booking:"CR-2026-001",customer:"Sarah Johnson",amount:250,status:"Paid",date:"2026-09-20"},
    {id:2,invoice:"INV-1002",booking:"CR-2026-002",customer:"Rajesh Kumar",amount:150,status:"Paid",date:"2026-09-19"},
    {id:3,invoice:"INV-1003",booking:"CR-2026-003",customer:"Anitha Devi",amount:320,status:"Unpaid",date:"2026-09-21"}
  ],
  customers:[
    {id:1,name:"Sarah Johnson",email:"sarah@example.com",phone:"+91 9876500001",address:"Chennai, Tamil Nadu",preferences:"SMS updates"},
    {id:2,name:"Rajesh Kumar",email:"rajesh@example.com",phone:"+91 9876500002",address:"Coimbatore, Tamil Nadu",preferences:"Email updates"},
    {id:3,name:"Anitha Devi",email:"anitha@example.com",phone:"+91 9876500003",address:"Coimbatore, Tamil Nadu",preferences:"WhatsApp updates"}
  ]
};

let data = JSON.parse(localStorage.getItem(STORAGE) || "null") || structuredClone(defaultData);
let currentSection = "dashboard";
let editingId = null;

function save(){ localStorage.setItem(STORAGE, JSON.stringify(data)); refreshAll(); }
function money(n){ return "₹" + Number(n||0).toLocaleString("en-IN"); }
function esc(v){ return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
function slug(s){return String(s).toLowerCase().replaceAll(" ","-");}
function toast(msg,type="success"){const el=document.createElement("div");el.className="toast "+type;el.innerHTML=`<i class="fa-solid ${type==="error"?"fa-circle-exclamation":"fa-circle-check"}"></i> ${esc(msg)}`;$("toastContainer").appendChild(el);setTimeout(()=>el.remove(),2800);}
function showSection(id){
  currentSection=id;
  document.querySelectorAll(".section").forEach(s=>s.classList.toggle("active",s.id===id));
  document.querySelectorAll(".nav-item[data-section]").forEach(b=>b.classList.toggle("active",b.dataset.section===id));
  const titles={dashboard:["Dashboard","Welcome back! Here's today's overview."],bookings:["Booking Management","Create, edit, search and manage courier bookings."],tracking:["Shipment Tracking","Track a shipment using its tracking number."],personnel:["Delivery Personnel","Manage delivery staff and assigned deliveries."],routes:["Route Management","Plan and manage delivery routes."],billing:["Billing & Invoicing","Generate invoices and track payment status."],customers:["Customer Management","Manage customer profiles and delivery history."],reports:["Reports & Analytics","Courier performance and revenue insights."]};
  $("pageTitle").textContent=titles[id][0];$("pageSubtitle").textContent=titles[id][1];
  $("sidebar").classList.remove("open"); refreshAll();
}
document.querySelectorAll(".nav-item[data-section]").forEach(b=>b.addEventListener("click",()=>showSection(b.dataset.section)));
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
$("darkModeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("courierDark",document.body.classList.contains("dark"));toast("Theme updated")};
if(localStorage.getItem("courierDark")==="true")document.body.classList.add("dark");
$("logoutBtn").onclick=()=>{localStorage.removeItem("courierLoggedIn");$("app").classList.add("hidden");$("loginScreen").classList.remove("hidden")};
$("loginForm").onsubmit=e=>{e.preventDefault();localStorage.setItem("courierLoggedIn","true");$("loginScreen").classList.add("hidden");$("app").classList.remove("hidden");toast("Login successful");};
if(localStorage.getItem("courierLoggedIn")==="true"){$("loginScreen").classList.add("hidden");$("app").classList.remove("hidden")}

function refreshAll(){renderDashboard();renderBookings();renderPersonnel();renderRoutes();renderInvoices();renderCustomers();renderReports();}
function statusBadge(s){return `<span class="badge ${slug(s)}">${esc(s)}</span>`}

function renderDashboard(){
  const b=data.bookings;
  $("statShipments").textContent=b.length;
  $("statTransit").textContent=b.filter(x=>x.status==="In Transit").length;
  $("statDelivered").textContent=b.filter(x=>x.status==="Delivered").length;
  $("statRevenue").textContent=money(b.reduce((a,x)=>a+Number(x.amount),0));
  const counts=["Pending","In Transit","Out for Delivery","Delivered"].map(s=>b.filter(x=>x.status===s).length);
  const max=Math.max(...counts,1);
  const labels=["Pending","Transit","Delivery","Delivered"];
  $("shipmentChart").innerHTML=counts.map((n,i)=>`<div class="bar-wrap"><div class="bar" style="height:${Math.max(8,n/max*90)}%"></div><span class="bar-label">${labels[i]}</span></div>`).join("");
  $("recentBookings").innerHTML=b.slice().reverse().slice(0,5).map(x=>`<tr><td><strong>${esc(x.tracking)}</strong></td><td>${esc(x.sender)}</td><td>${esc(x.receiver)}</td><td>${money(x.amount)}</td><td>${statusBadge(x.status)}</td><td>${esc(x.date)}</td></tr>`).join("")||`<tr><td colspan="6" class="empty">No bookings</td></tr>`;
}

$("bookingSearch").oninput=renderBookings;
$("bookingStatusFilter").onchange=renderBookings;
function renderBookings(){
  const q=($("bookingSearch")?.value||"").toLowerCase(), f=$("bookingStatusFilter")?.value||"";
  const list=data.bookings.filter(x=>(!q||`${x.tracking} ${x.sender} ${x.receiver}`.toLowerCase().includes(q))&&(!f||x.status===f));
  $("bookingTable").innerHTML=list.map(x=>`<tr>
    <td><strong>${esc(x.tracking)}</strong></td><td>${esc(x.sender)}</td><td>${esc(x.receiver)}</td><td>${esc(x.weight)}</td><td>${money(x.amount)}</td><td>${statusBadge(x.status)}</td><td>${esc(x.date)}</td>
    <td><div class="actions"><button class="action-btn" title="Edit" onclick="editBooking(${x.id})"><i class="fa-solid fa-pen"></i></button><button class="action-btn" title="Delete" onclick="deleteBooking(${x.id})"><i class="fa-solid fa-trash"></i></button><button class="action-btn" title="Track" onclick="quickTrack('${x.tracking}')"><i class="fa-solid fa-location-dot"></i></button></div></td>
  </tr>`).join("")||`<tr><td colspan="8" class="empty">No matching bookings</td></tr>`;
}
function openBookingModal(id=null){
 editingId=id;
 const x=id?data.bookings.find(a=>a.id===id):{tracking:"CR-2026-"+String(Date.now()).slice(-3),sender:"",receiver:"",weight:"",status:"Pending",amount:"",date:new Date().toISOString().slice(0,10),location:"Chennai Hub",eta:""};
 $("modalBox").innerHTML=`<div class="modal-head"><h3>${id?"Edit Booking":"New Booking"}</h3><button class="close" onclick="closeModal()">×</button></div>
 <form onsubmit="saveBooking(event)">
 <div class="form-grid">
 <div class="form-group"><label>Tracking Number</label><input id="fTracking" value="${esc(x.tracking)}" required></div>
 <div class="form-group"><label>Date</label><input id="fDate" type="date" value="${esc(x.date)}" required></div>
 <div class="form-group"><label>Sender</label><input id="fSender" value="${esc(x.sender)}" required></div>
 <div class="form-group"><label>Receiver</label><input id="fReceiver" value="${esc(x.receiver)}" required></div>
 <div class="form-group"><label>Weight</label><input id="fWeight" value="${esc(x.weight)}" placeholder="2.5 kg" required></div>
 <div class="form-group"><label>Amount (₹)</label><input id="fAmount" type="number" min="0" value="${x.amount}" required></div>
 <div class="form-group"><label>Status</label><select id="fStatus">${["Pending","In Transit","Out for Delivery","Delivered","Cancelled"].map(s=>`<option ${s===x.status?"selected":""}>${s}</option>`).join("")}</select></div>
 <div class="form-group"><label>Current Location</label><input id="fLocation" value="${esc(x.location)}"></div>
 <div class="form-group"><label>Expected Delivery</label><input id="fEta" value="${esc(x.eta)}"></div>
 </div><div class="modal-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save Booking</button></div></form>`;
 $("modalOverlay").classList.add("show");
}
function saveBooking(e){e.preventDefault();const obj={id:editingId||Date.now(),tracking:$("fTracking").value.trim(),date:$("fDate").value,sender:$("fSender").value.trim(),receiver:$("fReceiver").value.trim(),weight:$("fWeight").value.trim(),amount:Number($("fAmount").value),status:$("fStatus").value,location:$("fLocation").value.trim()||"Chennai Hub",eta:$("fEta").value.trim()||"Pending"};if(editingId){const i=data.bookings.findIndex(x=>x.id===editingId);data.bookings[i]=obj;toast("Booking updated")}else{data.bookings.push(obj);toast("Booking created")};closeModal();save();}
function editBooking(id){openBookingModal(id)}
function deleteBooking(id){if(confirm("Delete this booking?")){data.bookings=data.bookings.filter(x=>x.id!==id);save();toast("Booking deleted")}}
function quickTrack(t){showSection("tracking");$("trackingInput").value=t;trackShipment()}

function trackShipment(){
 const q=$("trackingInput").value.trim().toLowerCase(),x=data.bookings.find(a=>a.tracking.toLowerCase()===q);
 if(!x){$("trackingResult").innerHTML=`<div class="card empty"><i class="fa-solid fa-box-open"></i><br>Shipment not found. Please check the tracking number.</div>`;return}
 const states=["Pending","In Transit","Out for Delivery","Delivered"],idx=states.indexOf(x.status);
 $("trackingResult").innerHTML=`<div class="tracking-card">
 <div class="tracking-top"><div><div class="tracking-number">${esc(x.tracking)}</div><small>${esc(x.sender)} → ${esc(x.receiver)}</small></div>${statusBadge(x.status)}</div>
 <div class="timeline">${states.map((s,i)=>`<div class="timeline-step ${i<=idx?"done":""}"><div class="timeline-icon"><i class="fa-solid ${i===0?"fa-clock":i===1?"fa-truck":i===2?"fa-person-walking":"fa-circle-check"}"></i></div><span>${s}</span></div>`).join("")}</div>
 <div class="tracking-details"><div class="detail-box"><small>Current Location</small><strong>${esc(x.location)}</strong></div><div class="detail-box"><small>Expected Delivery</small><strong>${esc(x.eta)}</strong></div><div class="detail-box"><small>Package Value</small><strong>${money(x.amount)}</strong></div></div>
 <div style="margin-top:20px;display:flex;gap:8px"><button class="btn btn-primary" onclick="advanceStatus(${x.id})"><i class="fa-solid fa-forward"></i> Update Status</button><button class="btn btn-light" onclick="simulateNotification('${x.tracking}')"><i class="fa-regular fa-bell"></i> Notify Customer</button></div>
 </div>`;
}
function advanceStatus(id){const order=["Pending","In Transit","Out for Delivery","Delivered"];const x=data.bookings.find(a=>a.id===id),i=order.indexOf(x.status);if(i<3){x.status=order[i+1];if(x.status==="Delivered"){x.location=x.receiver;x.eta="Delivered"}save();trackShipment();toast("Shipment status updated")}else toast("Shipment is already delivered")}
function simulateNotification(t){toast(`Notification sent for ${t}`)}

function renderPersonnel(){$("personnelTable").innerHTML=data.personnel.map(x=>`<tr><td><strong>${esc(x.name)}</strong></td><td>${esc(x.contact)}</td><td>${esc(x.vehicle)}</td><td>${esc(x.route)}</td><td>${statusBadge(x.status)}</td><td><div class="actions"><button class="action-btn" onclick="editPersonnel(${x.id})"><i class="fa-solid fa-pen"></i></button><button class="action-btn" onclick="deletePersonnel(${x.id})"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join("")}
function openPersonnelModal(id=null){editingId=id;const x=id?data.personnel.find(a=>a.id===id):{name:"",contact:"",vehicle:"",route:"Route A",status:"Active"};$("modalBox").innerHTML=`<div class="modal-head"><h3>${id?"Edit Personnel":"Add Personnel"}</h3><button class="close" onclick="closeModal()">×</button></div><form onsubmit="savePersonnel(event)"><div class="form-grid"><div class="form-group"><label>Name</label><input id="pName" value="${esc(x.name)}" required></div><div class="form-group"><label>Contact</label><input id="pContact" value="${esc(x.contact)}" required></div><div class="form-group"><label>Vehicle Number</label><input id="pVehicle" value="${esc(x.vehicle)}" required></div><div class="form-group"><label>Route</label><select id="pRoute">${data.routes.map(r=>`<option ${r.name===x.route?"selected":""}>${r.name}</option>`).join("")}</select></div><div class="form-group"><label>Status</label><select id="pStatus"><option ${x.status==="Active"?"selected":""}>Active</option><option ${x.status==="Inactive"?"selected":""}>Inactive</option></select></div></div><div class="modal-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save</button></div></form>`;$("modalOverlay").classList.add("show")}
function savePersonnel(e){e.preventDefault();const obj={id:editingId||Date.now(),name:$("pName").value,contact:$("pContact").value,vehicle:$("pVehicle").value,route:$("pRoute").value,status:$("pStatus").value};if(editingId)data.personnel[data.personnel.findIndex(x=>x.id===editingId)]=obj;else data.personnel.push(obj);closeModal();save();toast("Personnel saved")}
function editPersonnel(id){openPersonnelModal(id)}function deletePersonnel(id){if(confirm("Delete personnel?")){data.personnel=data.personnel.filter(x=>x.id!==id);save();toast("Personnel deleted")}}

function renderRoutes(){$("routeCards").innerHTML=data.routes.map(r=>`<div class="route-card"><div class="route-head"><div><h4>${esc(r.name)}</h4><p>${esc(r.area)}</p></div>${statusBadge(r.status)}</div><div class="route-line">${r.stops.map(s=>`<div class="route-stop">${esc(s)}</div>`).join("")}</div><p><i class="fa-solid fa-user"></i> ${esc(r.personnel)}</p><div class="actions" style="margin-top:15px"><button class="btn btn-light" onclick="editRoute(${r.id})"><i class="fa-solid fa-pen"></i> Edit</button><button class="btn btn-danger" onclick="deleteRoute(${r.id})"><i class="fa-solid fa-trash"></i></button></div></div>`).join("")}
function openRouteModal(id=null){editingId=id;const x=id?data.routes.find(a=>a.id===id):{name:"",area:"",stops:["","",""],personnel:data.personnel[0]?.name||"",status:"Planned"};$("modalBox").innerHTML=`<div class="modal-head"><h3>${id?"Edit Route":"Add Route"}</h3><button class="close" onclick="closeModal()">×</button></div><form onsubmit="saveRoute(event)"><div class="form-grid"><div class="form-group"><label>Route Name</label><input id="rName" value="${esc(x.name)}" required></div><div class="form-group"><label>Area</label><input id="rArea" value="${esc(x.area)}" required></div><div class="form-group full-width"><label>Stops (comma separated)</label><input id="rStops" value="${esc(x.stops.join(", "))}" required></div><div class="form-group"><label>Personnel</label><select id="rPerson">${data.personnel.map(p=>`<option ${p.name===x.personnel?"selected":""}>${esc(p.name)}</option>`).join("")}</select></div><div class="form-group"><label>Status</label><select id="rStatus"><option ${x.status==="Active"?"selected":""}>Active</option><option ${x.status==="Planned"?"selected":""}>Planned</option><option ${x.status==="Completed"?"selected":""}>Completed</option></select></div></div><div class="modal-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save</button></div></form>`;$("modalOverlay").classList.add("show")}
function saveRoute(e){e.preventDefault();const obj={id:editingId||Date.now(),name:$("rName").value,area:$("rArea").value,stops:$("rStops").value.split(",").map(s=>s.trim()).filter(Boolean),personnel:$("rPerson").value,status:$("rStatus").value};if(editingId)data.routes[data.routes.findIndex(x=>x.id===editingId)]=obj;else data.routes.push(obj);closeModal();save();toast("Route saved")}
function editRoute(id){openRouteModal(id)}function deleteRoute(id){if(confirm("Delete route?")){data.routes=data.routes.filter(x=>x.id!==id);save();toast("Route deleted")}}

function renderInvoices(){
 const total=data.invoices.reduce((a,x)=>a+x.amount,0),paid=data.invoices.filter(x=>x.status==="Paid").reduce((a,x)=>a+x.amount,0);
 $("totalBilled").textContent=money(total);$("totalPaid").textContent=money(paid);$("totalPending").textContent=money(total-paid);
 $("invoiceTable").innerHTML=data.invoices.map(x=>`<tr><td><strong>${esc(x.invoice)}</strong></td><td>${esc(x.booking)}</td><td>${esc(x.customer)}</td><td>${money(x.amount)}</td><td>${statusBadge(x.status)}</td><td>${esc(x.date)}</td><td><div class="actions"><button class="action-btn" title="Payment" onclick="togglePayment(${x.id})"><i class="fa-solid fa-credit-card"></i></button><button class="action-btn" title="Print" onclick="printInvoice(${x.id})"><i class="fa-solid fa-print"></i></button></div></td></tr>`).join("")}
function generateInvoice(){if(!data.bookings.length)return toast("Create a booking first","error");const b=data.bookings[data.bookings.length-1],customer=b.receiver;data.invoices.push({id:Date.now(),invoice:"INV-"+(1000+data.invoices.length+1),booking:b.tracking,customer,amount:b.amount,status:"Unpaid",date:new Date().toISOString().slice(0,10)});save();toast("Invoice generated")}
function togglePayment(id){const x=data.invoices.find(a=>a.id===id);x.status=x.status==="Paid"?"Unpaid":"Paid";save();toast("Payment status updated")}
function printInvoice(id){const x=data.invoices.find(a=>a.id===id);const w=window.open("","_blank");w.document.write(`<html><head><title>${x.invoice}</title><style>body{font-family:Arial;padding:40px}h1{color:#e11d48}table{width:100%;border-collapse:collapse}td{padding:12px;border-bottom:1px solid #ddd}</style></head><body><h1>CourierPro</h1><h2>Invoice ${x.invoice}</h2><table><tr><td>Booking</td><td>${x.booking}</td></tr><tr><td>Customer</td><td>${x.customer}</td></tr><tr><td>Amount</td><td>₹${x.amount}</td></tr><tr><td>Status</td><td>${x.status}</td></tr><tr><td>Date</td><td>${x.date}</td></tr></table><script>window.print()<\/script></body></html>`);w.document.close()}

$("customerSearch").oninput=renderCustomers;
function renderCustomers(){const q=($("customerSearch")?.value||"").toLowerCase();const list=data.customers.filter(x=>`${x.name} ${x.email} ${x.phone}`.toLowerCase().includes(q));$("customerCards").innerHTML=list.map(x=>`<div class="customer-card"><div class="customer-head"><div class="customer-avatar">${esc(x.name.split(" ").map(n=>n[0]).slice(0,2).join(""))}</div><div class="actions"><button class="action-btn" onclick="editCustomer(${x.id})"><i class="fa-solid fa-pen"></i></button><button class="action-btn" onclick="deleteCustomer(${x.id})"><i class="fa-solid fa-trash"></i></button></div></div><h4 style="margin-top:14px">${esc(x.name)}</h4><div class="customer-info"><div><i class="fa-regular fa-envelope"></i>${esc(x.email)}</div><div><i class="fa-solid fa-phone"></i>${esc(x.phone)}</div><div><i class="fa-solid fa-location-dot"></i>${esc(x.address)}</div><div><i class="fa-solid fa-bell"></i>${esc(x.preferences)}</div></div></div>`).join("")||`<div class="empty">No customers found</div>`}
function openCustomerModal(id=null){editingId=id;const x=id?data.customers.find(a=>a.id===id):{name:"",email:"",phone:"",address:"",preferences:"SMS updates"};$("modalBox").innerHTML=`<div class="modal-head"><h3>${id?"Edit Customer":"Add Customer"}</h3><button class="close" onclick="closeModal()">×</button></div><form onsubmit="saveCustomer(event)"><div class="form-grid"><div class="form-group"><label>Name</label><input id="cName" value="${esc(x.name)}" required></div><div class="form-group"><label>Email</label><input id="cEmail" type="email" value="${esc(x.email)}" required></div><div class="form-group"><label>Phone</label><input id="cPhone" value="${esc(x.phone)}" required></div><div class="form-group"><label>Preferences</label><select id="cPref"><option ${x.preferences==="SMS updates"?"selected":""}>SMS updates</option><option ${x.preferences==="Email updates"?"selected":""}>Email updates</option><option ${x.preferences==="WhatsApp updates"?"selected":""}>WhatsApp updates</option></select></div><div class="form-group full-width"><label>Address</label><textarea id="cAddress" rows="3">${esc(x.address)}</textarea></div></div><div class="modal-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary">Save</button></div></form>`;$("modalOverlay").classList.add("show")}
function saveCustomer(e){e.preventDefault();const obj={id:editingId||Date.now(),name:$("cName").value,email:$("cEmail").value,phone:$("cPhone").value,address:$("cAddress").value,preferences:$("cPref").value};if(editingId)data.customers[data.customers.findIndex(x=>x.id===editingId)]=obj;else data.customers.push(obj);closeModal();save();toast("Customer saved")}
function editCustomer(id){openCustomerModal(id)}function deleteCustomer(id){if(confirm("Delete customer?")){data.customers=data.customers.filter(x=>x.id!==id);save();toast("Customer deleted")}}

function renderReports(){
 const b=data.bookings,total=b.length,counts=["Pending","In Transit","Out for Delivery","Delivered","Cancelled"];
 $("statusReport").innerHTML=counts.map(s=>{const n=b.filter(x=>x.status===s).length,p=total?Math.round(n/total*100):0;return `<div class="status-row"><div class="status-row-head"><span>${s}</span><strong>${n} (${p}%)</strong></div><div class="progress"><span style="width:${p}%"></span></div></div>`}).join("");
 const revenue=b.reduce((a,x)=>a+x.amount,0),delivery=total?Math.round(b.filter(x=>x.status==="Delivered").length/total*100):0;
 $("performanceReport").innerHTML=`<div class="performance-item"><span>Total Shipments</span><strong>${total}</strong></div><div class="performance-item"><span>Delivery Rate</span><strong>${delivery}%</strong></div><div class="performance-item"><span>Total Revenue</span><strong>${money(revenue)}</strong></div><div class="performance-item"><span>Active Personnel</span><strong>${data.personnel.filter(x=>x.status==="Active").length}</strong></div><div class="performance-item"><span>Routes</span><strong>${data.routes.length}</strong></div>`;
 $("reportTable").innerHTML=b.map(x=>`<tr><td>${esc(x.tracking)}</td><td>${esc(x.sender)}</td><td>${esc(x.receiver)}</td><td>${statusBadge(x.status)}</td><td>${money(x.amount)}</td><td>${esc(x.date)}</td></tr>`).join("");
}
function exportCSV(){const rows=[["Tracking","Sender","Receiver","Weight","Amount","Status","Date"],...data.bookings.map(x=>[x.tracking,x.sender,x.receiver,x.weight,x.amount,x.status,x.date])];const csv=rows.map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="courierpro-report.csv";a.click();URL.revokeObjectURL(a.href);toast("CSV report exported")}

function closeModal(){$("modalOverlay").classList.remove("show");editingId=null}
$("modalOverlay").addEventListener("click",e=>{if(e.target.id==="modalOverlay")closeModal()});
$("notificationBtn").onclick=()=>toast("3 simulated notifications: 1 delivery update, 1 payment reminder, 1 new booking");

function refreshAllSafe(){try{refreshAll()}catch(e){console.error(e)}}
refreshAllSafe();
