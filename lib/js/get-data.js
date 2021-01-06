//adapted from the cerner smart on fhir guide. updated to utalize client.js v2 library and FHIR R4
var weightOb;
var age;
var gender;

// helper function to process fhir resource to get the patient name.
function getPatientName(pt) {
  if (pt.name) {
    var names = pt.name.map(function(name) {
      return name.given.join(" ") + " " + name.family;
    });
    return names.join(" / ")
  } else {
    return "anonymous";
  }
}

// display the patient name gender and dob in the index page
function displayPatient(pt) {
  document.getElementById('patient_name').innerHTML = getPatientName(pt);

  gender = pt.gender;
  document.getElementById('gender').innerHTML = pt.gender;

  var dob = new Date(pt.birthDate);
  var today = new Date();
  age = Math.floor((today-dob) / (365.25 * 24 * 60 * 60 *1000));

  document.getElementById('dob').innerHTML = pt.birthDate + ' ('+age+' years old)';
}

function displayHeartRisk(data) {
  if (data.queryresult.numpods==0) {
    document.getElementById('results').innerHTML='Unable to perform analysis based on available data.';
  }
  else
  {
    document.getElementById('results').innerHTML='';
    for (var i=1;i<data.queryresult.pods.length;i++)
    {
        var pod = data.queryresult.pods[i];
        document.getElementById('results').innerHTML=document.getElementById('results').innerHTML+
          '<p class="subtitle">'+pod.title+'</p>'+
          '<div class="result-image">'+
          '<img src="'+pod.subpods[0].img.src+'"></div>';
    }
  }
  //document.getElementById('ImpactOnRisk').innerHTML="<img src='"+data.queryresult.pods[2].subpods[0].img.src+"'>";
  //document.getElementById('RiskOverTime').innerHTML="<img src='"+data.queryresult.pods[3].subpods[0].img.src+"'>";
  
}

//helper function to get quanity and unit from an observation resoruce.
function getQuantityValueAndUnit(ob) {
  if (typeof ob != 'undefined' &&
    typeof ob.valueQuantity != 'undefined' &&
    typeof ob.valueQuantity.value != 'undefined' &&
    typeof ob.valueQuantity.unit != 'undefined') {
    return Number(parseFloat((ob.valueQuantity.value)).toFixed(2)) + ' ' + ob.valueQuantity.unit;
  } else {
    return undefined;
  }
}

// helper function to get both systolic and diastolic bp
function getBloodPressureValue(BPObservations, typeOfPressure) {
  var formattedBPObservations = [];
  BPObservations.forEach(function(observation) {
    var BP = observation.component.find(function(component) {
      return component.code.coding.find(function(coding) {
        return coding.code == typeOfPressure;
      });
    });
    if (BP) {
      observation.valueQuantity = BP.valueQuantity;
      formattedBPObservations.push(observation);
    }
  });

  return getQuantityValueAndUnit(formattedBPObservations[0]);
}

// create a patient object to initalize the patient
function defaultPatient() {
  return {
    height: {
      value: ''
    },
    weight: {
      value: ''
    },
    sys: {
      value: ''
    },
    dia: {
      value: ''
    },
    ldl: {
      value: ''
    },
    hdl: {
      value: ''
    },
    note: 'No Annotation',
  };
}

//helper function to display the annotation on the index page
function displayAnnotation(annotation) {
  note.innerHTML = annotation;
}

//function to display the observation values you will need to update this
function displayObservation(obs) {
  hdl.innerHTML = obs.hdl;
  ldl.innerHTML = obs.ldl;
  sys.innerHTML = obs.sys;
  dia.innerHTML = obs.dia;
  weight.innerHTML = obs.weight;
  height.innerHTML = obs.height;
}

//once fhir client is authorized then the following functions can be executed
FHIR.oauth2.ready().then(function(client) {

  // get patient object and then display its demographics info in the banner
  client.request(`Patient/${client.patient.id}`).then(
    function(patient) {
      displayPatient(patient);
      console.log(patient);
    }
  );

  var patientId = client.patient.id;

  // get observation resoruce values
  // you will need to update the below to retrive the weight and height values
  var query = new URLSearchParams();
  
  query.set("patient", patientId);
  query.set("_count", 100);
  query.set("_sort", "-date");
  query.set("code", [
    'http://loinc.org|18262-6',
    'http://loinc.org|8462-4',
    'http://loinc.org|8480-6',
    'http://loinc.org|2085-9',
    'http://loinc.org|2089-1',
    'http://loinc.org|55284-4',
    'http://loinc.org|3141-9',
    'http://loinc.org|29463-7',
    'http://loinc.org|8302-2',
    'http://loinc.org|3141-9',
    'http://loinc.org|8351-9',
    'http://loinc.org|8350-1',
    'http://loinc.org|75292-3',
    'http://loinc.org|79348-9',
    'http://loinc.org|3142-7',
  ].join(","));

  client.request("Observation?" + query, {
    pageLimit: 0,
    flat: true
  }).then(
    function(ob) {

      // group all of the observation resoruces by type into their own
      var byCodes = client.byCodes(ob, 'code');
      var systolicbp = getBloodPressureValue(byCodes('55284-4'), '8480-6');
      var diastolicbp = getBloodPressureValue(byCodes('55284-4'), '8462-4');
      var hdl = byCodes('2085-9');
      var ldl = byCodes('18262-6') || byCodes('2089-1');
      //Patient Weight Codes
      //https://loinc.org/LG34372-9/
      //29463-7	Body weight
      //3141-9	Body weight Measured
      //8351-9	Body weight Measured --without clothes
      //8350-1	Body weight Measured --with clothes
      //75292-3	Body weight - Reported --usual
      //79348-9	Body weight --used for drug calculation
      //3142-7	Body weight Stated
      var weight = byCodes('29463-7') || byCodes('3141-9') || byCodes('8351-9') || byCodes('8350-1') || byCodes('75292-3') || byCodes('79348-9') || byCodes('3142-7')
      var height = byCodes('8302-2');

      // create patient object
      var p = defaultPatient();

      // set patient value parameters to the data pulled from the observation resoruce
      if (typeof systolicbp != 'undefined') {
        p.sys = systolicbp;
      } else {
        p.sys = 'undefined'
      }

      if (typeof diastolicbp != 'undefined') {
        p.dia = diastolicbp;
      } else {
        p.dia = 'undefined'
      }

      p.hdl = getQuantityValueAndUnit(hdl[0]);
      p.ldl = getQuantityValueAndUnit(ldl[0]);
      p.weight = getQuantityValueAndUnit(weight[0]);
      p.height = getQuantityValueAndUnit(height[0]);

      weightOb = weight[0];
      
      displayObservation(p);

      var jqxhr = $.get( 
        'https://wolfgramapi.azurewebsites.net/api/heartattackrisk?'+
        `ldl=${p.ldl}&hdl=${p.hdl}&sys=${p.sys}&dia=${p.dia}&gender=${gender}&age=${age}`, function(data) {
          console.log(data);
          displayHeartRisk(data);
        }, "JSON");

    });

  query = new URLSearchParams();
  query.set("patient", patientId);
  query.set("_count", 100);
  
  //update function to take in text input from the app and add the note for the latest weight observation annotation
  //you should include text and the author can be set to anything of your choice. keep in mind that this data will
  // be posted to a public sandbox
  function addWeightAnnotation() {
    var annotation = document.getElementById('annotation').value;

    if (typeof weightOb.note == 'undefined') {
      weightOb.note = [];
    }
    
    var tz = new Date().getTimezoneOffset()/60;
    if (tz<10) {
      tz='0'+tz;
    }
    var d = new Date().toISOString().slice(0,19)+'+'+tz+':00';
    
    weightOb.note.push({authorString:"britchie3", 
            "time": d,
            "text": annotation
    });
    client.update(weightOb);
    displayAnnotation(annotation);

  }

  //event listner when the add button is clicked to call the function that will add the note to the weight observation
  document.getElementById('add').addEventListener('click', addWeightAnnotation);


}).catch(console.error);
