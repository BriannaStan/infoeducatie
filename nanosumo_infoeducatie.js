E.on('init', function() { 
  //sensor setup
I2C1.setup({sda:B7,scl:B6,bitrate:400000}); //i2c1 on pins B7 SDA, B6 SCL
var distance = 0;
var last = getTime();
var laser = require("VL53L1X").connect(I2C1,
                                         {distanceMode:'short', // detection distance short
                                          enable2V8Mode:true, //high power mode
                                          timingBudget:25000, //max microseconds for each distance read
                                          interMeasurementPeriod:20 //time between reads
                                         });

function setSpeeds(leftSpeed, rightSpeed){
  if(rightSpeed<0){
      digitalWrite(A7,1);
      analogWrite(B1,-rightSpeed,{freq:1000,soft:true});
  } else {
      digitalWrite(A7,0);
      analogWrite(B1,rightSpeed,{freq:1000,soft:true});
  }
  if(leftSpeed<0){
      digitalWrite(B10,1);
      analogWrite(B13,-leftSpeed,{freq:1000,soft:true});
  } else {
      digitalWrite(B10,0);
      analogWrite(B13,leftSpeed,{freq:1000,soft:true});
  }
}

var count = 0;
function readSensor(){
  try{
    laser.read();
    distance = laser.getDistance();
    count++;
  }catch(e){
    laser.startContinuous(25);
  }
}

function printStatistics(){
  console.log("Sensor reads count:"+count);
  count = 0;
}

//if something detected in front will go forward
//if nothing detected will spin
function robot(){
  if(distance>0 && distance<200){
    setSpeeds(1,1);
  } else {
    setSpeeds(.5,-.5);
  }
}


//motor setup
pinMode(A6,'output'); //motor mode
digitalWrite(A6,1);
pinMode(B14,'output'); //logic 3.3v motor driver
digitalWrite(B14,1); //enable driver
pinMode(B15,'input');
//motor signal setup
pinMode(B13,'output');//motor2 pwm
pinMode(B10,'output');//motor2 dir
pinMode(B1,'output');//motor1 pwm
pinMode(A7,'output');//motor1 dir

digitalWrite(B13,0); 
digitalWrite(B10,0);
digitalWrite(B1,0);
digitalWrite(A7,0);

//watch for pin B4 when sensor reports read complete
setWatch(readSensor,B4,{repeat:true,edge:-1,debounce:0}); 
laser.startContinuous(25);//read continuous every 25ms
var intervalId;

//take 5s break
setTimeout(function(){
  //show we started
  digitalWrite(LED1,1);
  setSpeeds(1,1);
  //go forward 200ms then start standard logic
  setTimeout(function(){
    intervalId = setInterval(robot, 5); 
  },300); 
  //after 10s shutdown
  setTimeout(function(){
    clearInterval(intervalId);
    setSpeeds(0,0);
    //show we stopped
    digitalWrite(LED1,0);
  },10000); 
},5000);

});