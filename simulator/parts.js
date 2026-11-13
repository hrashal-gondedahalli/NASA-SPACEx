/* Original illustrated catalogue; all parts connect to the shared flight model. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.OrbitalParts=factory();})(globalThis,()=>[
 {id:'payload',label:'Capsule',group:'Control',art:'capsule',tip:'Choose explorer, science or cargo mass.'},
 {id:'parachute',label:'Parachute',group:'Landing',art:'chute',toggle:true,tip:'Deploy below 5 km and 250 m/s in Earth air. Not on the Moon.'},
 {id:'legs',label:'Landing legs',group:'Landing',art:'legs',toggle:true,tip:'Extend for a wider landing stance and a 12 m/s touchdown limit.'},
 {id:'heatShield',label:'Heat shield',group:'Protection',art:'shield',toggle:true,tip:'Adds mass and reduces heating in the simplified re-entry model.'},
 {id:'separator',label:'Separator',group:'Staging',art:'separator',toggle:true,tip:'Required to release the booster stage.'},
 {id:'radialSeparator',label:'Side release',group:'Staging',art:'radial',stage:true,toggle:true,tip:'Allows side boosters to detach.'},
 {id:'tank-small',label:'Small tank',group:'Fuel',art:'tank small',key:'tanks',size:'small',tip:'2,000 kg fuel; light and short.'},
 {id:'tanks',label:'Tank',group:'Fuel',art:'tank',key:'tanks',size:'standard',tip:'4,000 kg fuel.'},
 {id:'tank-large',label:'Large tank',group:'Fuel',art:'tank tall',key:'tanks',size:'large',tip:'6,000 kg fuel; more mass.'},
 {id:'tank-slim',label:'Slim tank',group:'Fuel',art:'tank slim',key:'tanks',size:'slim',tip:'2,500 kg fuel in a narrow tank.'},
 {id:'engine-small',label:'Light engine',group:'Engines',art:'engine small',key:'engines',engine:'small',tip:'70 kN; efficient but lower lift. Changes this stage engine type.'},
 {id:'engines',label:'Engine',group:'Engines',art:'engine',key:'engines',engine:'standard',tip:'160 kN; balanced lift and efficiency.'},
 {id:'engine-heavy',label:'Heavy engine',group:'Engines',art:'engine heavy',key:'engines',engine:'heavy',tip:'300 kN; stronger but heavier and thirstier.'},
 {id:'boosters',label:'Side booster',group:'Boosters',art:'booster',stage:true,tip:'Adds thrust, fuel and mass. Needs a side release.'},
 {id:'rcs',label:'RCS',group:'Utility',art:'rcs',toggle:true,tip:'Extra steering authority using a separate small propellant reserve.'},
 {id:'noseCone',label:'Nose cone',group:'Aero',art:'nose',toggle:true,tip:'Reduces atmospheric drag.'},
 {id:'fairing',label:'Fairing',group:'Aero',art:'fairing',toggle:true,tip:'Aerodynamic payload cover. Jettison in flight to shed mass.'}
]);
