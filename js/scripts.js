
let datas;
let countColors;
let countColorsMap;
let table;
let coordonne;
let moveMap=true;
let tableOfPseudo={};
let time;
let moveX=0;
let moveY=0;
let scale=1;
let scaleValue=1;
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

let dbP = new Promise((resolve)=>{
  const request = window.indexedDB.open("pseudo",1);
  request.onsuccess = function(e) {
    resolve(request.result);
  };
  request.onupgradeneeded = function(event) {
    var db = event.target.result;

    db.onerror = function(event) {
      console.error(event)
    };

    // On ajoute un magasin d'objet à la base de données

    var objectStore = db.createObjectStore("pseudo", { keyPath: "id" });

    // définition des index de ce magasin d'objets

    objectStore.createIndex("last_name", "last_name", { unique: true });

  };
})

let regions;
var oReq = new XMLHttpRequest();
oReq.addEventListener("load", (event)=>{
  regions=JSON.parse(event.target.response);
})
oReq.open("GET", `https://api.codati.ovh/departements/`);

oReq.send();
const text = document.getElementById("text");
const color = document.getElementById("color");
const hex = document.getElementById("hex");
const textx = document.getElementById("textx");
const texty = document.getElementById("texty");
const stats = document.getElementById("stats");
const textInfoPixel = document.getElementById("textInfoPixel");
const mapElement = document.getElementById("map");
const infobulle = document.getElementById("infobulle");
const barnav = document.getElementById("barnav");
const camMap = document.getElementById("camMap");
const map = mapElement.getContext('2d');


function r(e, t) {
    var n, o, r, map = [], c = 0, l = 1;
    function m(e) {
        var t = e - c * l
          , n = l;
        map[e] = {
            x: t,
            y: n
        },
        t >= c - 1 && l++
    }
    for (var i = 0; i < e; i++) {
        Math.floor(c * t) <= l - 1 ? (o = void 0,
        r = void 0,
        o = c,
        r = (n = i) - c * l,
        map[n] = {
            x: o,
            y: r
        },
        r >= l - 1 && c++) : m(i)
    }
    return map
}

var oReq = new XMLHttpRequest();
oReq.addEventListener("load", (event)=>{
  console.log("test");
  datas = JSON.parse(event.target.response);

  hex.disabled=false;
  color.disabled=false;
  textx.disabled=false;
  texty.disabled=false;

  console.log(datas)
  let coordonne= r(datas.length,0.5);
  table=datas.reduce((accu,data,index)=>{

    const pos = coordonne[index];

    if(!accu[pos.x]){
      accu[pos.x]=[];
    }
    accu[pos.x][pos.y]={
      ...data,
      x:pos.x,
      y:pos.y,
    };
    return accu;
  },[]);
  const total = datas.length;

  countColors=datas.reduce((accu,data)=>{
    if(accu[data.hexColor]){
      accu[data.hexColor]=accu[data.hexColor]+1;
    } else {
      accu[data.hexColor]=1
    }
    return accu;
  },{});
  countColors =Object.keys(countColors).reduce((accu,color)=>{
    if(countColors[color] > 50){
      accu[color]=countColors[color];
    }
    return accu;
  },{});
  genereGraph(countColors);
  countColorsMap =Object.keys(countColors).reduce((accu,color)=>{
    accu[color]=true;
    return accu;
  },{})
  countColorsMap["autre"]=true;
  countColorsMap["tout"]=true;
  barnav.append(...Object.keys(countColorsMap).map((color)=>{
    const button = document.createElement("button");
    button.innerText=color;
    if(color !== "autre" || color !== "tout"){
      button.style.backgroundColor=color
    }
    if(color === "tout")
    {
        button.addEventListener("click",()=>{
          countColorsMap[color]=!countColorsMap[color];
          Object.keys(countColorsMap).forEach((key)=>{
            countColorsMap[key] =countColorsMap[color];
          })
          drowMap();
      });
    }else{
      button.addEventListener("click",()=>{
        countColorsMap[color]=!countColorsMap[color];
        drowMap();
      });
    }

    return button
  }));


  stats.innerHTML=Object.keys(countColors).reduce((accu,key)=>{
    if(key === "#000000")
    {
      return`${accu}<span style="background-color:${key};border: solid 1px #000;color:#fff">${key} ${countColors[key]} soit ${(countColors[key]/total)*100}%</span><br/>`;

      }else{
      return`${accu}<span style="background-color:${key};border: solid 1px #000;">${key} ${countColors[key]} soit ${(countColors[key]/total)*100}%</span><br/>`;
    }
  },`<span>Nombre total de pixels : ${total} soit ${table.length} X ${table[0].length}</span><br/>`);


  text.innerText="Chargement des données complété";
  textInfoPixel.innerText="Chargement des données complété";
  mapElement.width=table.length * 10;
  mapElement.height=table[0].length * 10;

  console.log( table.length, table[0].length)
  drowMap();
});
oReq.open("GET", "https://api-flag.fouloscopie.com/flag");

oReq.send();

function drowMap(){
  const flatmap = table.flat();
  map.clearRect(0,0, mapElement.width, mapElement.height);
  flatmap.forEach((pixel)=>{
    if(countColorsMap[pixel.hexColor]===true){
      map.fillStyle = pixel.hexColor;
      map.fillRect(pixel.x * 10, pixel.y * 10, 10, 10);
    }else if(countColorsMap[pixel.hexColor]===undefined && countColorsMap.autre){
      map.fillStyle = pixel.hexColor;
      map.fillRect(pixel.x * 10, pixel.y * 10, 10, 10);
    }

  });
}

async function getUserName(author){
  const db = await dbP;
  const transaction = db.transaction('pseudo','readonly');
  const objectStore =transaction.objectStore('pseudo');

  tableOfPseudo[author]={last_name:""};

  return new Promise((resolve,reject)=>{
    const objectStoreRequest =objectStore.get(author);
    objectStoreRequest.onsuccess =(event)=>{
      if(event.target.response){
        tableOfPseudo[author]= objectStoreRequest.result;
        resolve(tableOfPseudo[author]);
      }else{
        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", (event)=>{
          const transaction = db.transaction('pseudo','readwrite');
          const objectStore =transaction.objectStore('pseudo');
          tableOfPseudo[author]=JSON.parse(event.target.response);
          objectStore.add(tableOfPseudo[author]);
          resolve(tableOfPseudo[author]);
        })
        oReq.open("GET", `https://api.codati.ovh/users/${author}`);

        oReq.send();
      }
    }
  })
}
function getRegion(x,y) {
  console.log(regions)
  const region = regions.find((region)=>{
    return region.min.x <= x && region.min.y <= y && region.max.x >= x && region.max.y >= y
  });
  console.log(region)
  return region || {name:"n'a pas encore de nom"};
}

function count(){
  const colorUp= color.value.toUpperCase();
  text.innerText = datas.filter((data)=>{
    return data.hexColor === colorUp;
  }).length;
}
async function calculPos(x,y){
  if(!table[x-1] || !table[x-1][y-1]){
      textInfoPixel.innerHTML="existe pas";
    return;
  }
  const caseOfTable = table[x-1][y-1]
  let backgroundColor= "#000";
  if(caseOfTable.hexColor === "#000000")
  {
    backgroundColor="#fff";
  }
  const region = getRegion(x,y);
  console.log(region)
  textInfoPixel.innerHTML = `couleur: <span style="background-color:${backgroundColor};color:${caseOfTable.hexColor};border: solid 1px #000;">${caseOfTable.hexColor}</span><br/>
  index: ${caseOfTable.indexInFlag}<br/>
  Département:${region.name}<br/>
  Région:${region.region}<br/>
  Discord du départements:<a href="${region.discord}">${region.discord}</a><br/>
  pseudo:${tableOfPseudo[caseOfTable.author] ? tableOfPseudo[caseOfTable.author].last_name : (await getUserName(caseOfTable.author)).last_name}`;

}

document.addEventListener("keydown",(event)=>{
  if([83,90,68,81,65,69].indexOf(event.keyCode) != -1){
    if(!time){
      time = setInterval(()=>{
        console.log(mapElement.style.top,mapElement.style.left,mapElement.style.transform)
        if(mapElement.style.top){

          mapElement.style.top = (parseInt(mapElement.style.top)+moveY)+"px" ;
        } else {
          mapElement.style.top = "0px" ;
        }
        if(mapElement.style.left){
          mapElement.style.left = (parseInt(mapElement.style.left)+moveX)+"px" ;
        } else {
          mapElement.style.left = "0px" ;
        }
        scaleValue = scaleValue * scale;
        console.log(scaleValue)
        mapElement.style.transform  =`scale(${scaleValue}, ${scaleValue})`;
      },10)
    }
  }
  switch (event.keyCode) {
    case 83:
      moveY=-5
      break;
    case 90:
      moveY=+5
      break;
    case 68:
      moveX=-5
      break;
    case 81:
      moveX=5;
      break;
    case 65:
      scale=1.001;
      break;
    case 69:
      scale=0.999;
      break;
  }
});
document.addEventListener("keyup",(event)=>{
  console.log("keyup",event.keyCode)
  switch (event.keyCode) {
    case 90:
    case 83:
      moveY=0;
      if(moveX===0 && scale===1){
        clearInterval(time);
        time=undefined
      }
    break;
    case 81:
    case 68:
    moveX=0;
    if(moveY===0 && scale===1){
      clearInterval(time);
      time=undefined

    }
    case 65:
    case 69:
    scale=1;
    if(moveY===0&& moveX===0){
      clearInterval(time);
      time=undefined

    }
    break;


  }
});

mapElement.parentNode.addEventListener("click",async (event)=>{
  moveMap=!moveMap;
});
mapElement.parentNode.addEventListener("mousemove",async (event)=>{
  const pos = event.target.getBoundingClientRect()
  console.log(event.x,window.innerWidth);
  console.log(event.y,window.innerHeight);
  const x=Math.floor((event.x - pos.x)/(10*scaleValue));
  const y=Math.floor((event.y - pos.y)/(10*scaleValue));
  const casse = table[x][y];
  if(moveMap){
    infobulle.style.display="block";
    if(window.innerHeight - event.y - 60  < infobulle.clientHeight){
      infobulle.style.top=(event.y- infobulle.clientHeight)+"px" ;
    }else{
      infobulle.style.top=event.y+"px" ;
    }
    if(window.innerWidth - event.x - 20 < infobulle.clientWidth){
      infobulle.style.left=(event.x-infobulle.clientWidth) +"px";

    }else{
      infobulle.style.left=event.x +"px";

    }
    if( table[x][y]){

      infobulle.innerText=`position: ${x+1} ${y+1}
      couleur:${casse.hexColor}
      pseudo:${tableOfPseudo[casse.author] ? tableOfPseudo[casse.author].last_name : (await getUserName(casse.author)).last_name}
      département:${getRegion(x,y).name}`;
    }else{
      infobulle.innerText="error";
    }
  }

});
mapElement.parentNode.addEventListener("mouseleave",(event)=>{
  if(moveMap){
    infobulle.style.display="none";
  }

});
hex.addEventListener("change", (event)=>{
  text.innerText="calcule en cours";
  if(!event.target.value.startsWith("#")){
    hex.value = `#${hex.value}`
  }
  color.value = event.target.value;
  setTimeout(()=>{
    count(color.value)
  },0)

});


color.addEventListener("change", (event)=>{
  text.innerText="calcule en cours";
  hex.value = event.target.value;
  setTimeout(()=>{
    count(color.value);

  },0)
});


textx.addEventListener("change", (event)=>{
  text.textInfoPixel="calcule en cours";
  setTimeout(()=>{
    calculPos(textx.value,texty.value);
  },0)
});

texty.addEventListener("change", (event)=>{
  text.textInfoPixel="calcule en cours";
  setTimeout(()=>{
    calculPos(textx.value,texty.value);
  },0)
});


function genereGraph(tab) {
  const listeValue = [];
  const listeLabel = [];
  let totalsUser = 0;
  let reste = 0
  const total = datas.length;

  listeIndexHexa = Object.keys(countColors);
  for (var i = 0; i < listeIndexHexa.length; i++) {
    valeur = (countColors[listeIndexHexa[i]]/total)*100;
    totalsUser = totalsUser+valeur;
    listeValue.push(valeur);
    listeLabel.push(listeIndexHexa[i]+" ");
  }
  reste = 100-totalsUser;
  listeValue.push(reste);
  listeLabel.push("reste des couleurs ");

  listeIndexHexa.push("#00000000");
  const ctx = document.getElementById('myChart').getContext('2d');
  const myChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: listeLabel,
      datasets: [{
        label: '# of Votes',
        data: listeValue,
        backgroundColor: listeIndexHexa,
        borderColor: listeIndexHexa,
        borderWidth: 1
      }]
    },
    options: {
      scales: {

      }
    }
  });
}
