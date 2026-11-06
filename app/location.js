export const METRES_PER_DEGREE=111320;
export function localMetres(p,base){return [(p.longitude-base.longitude)*METRES_PER_DEGREE*Math.cos(base.latitude*Math.PI/180),-(p.latitude-base.latitude)*METRES_PER_DEGREE];}
export function align(a,b){
 const v=localMetres(b.fix,a.fix),w=[b.point[0]-a.point[0],b.point[1]-a.point[1]],distance=Math.hypot(...v);
 if(a.fix.accuracy>10||b.fix.accuracy>10)throw Error('Wait for location accuracy of 10 m or better at both points');
 if(distance<Math.max(60,4*(a.fix.accuracy+b.fix.accuracy))||Math.hypot(...w)<80)throw Error('Choose two points farther apart, ideally opposite ends of campus');
 const k=(w[0]*v[0]+w[1]*v[1])/(distance*distance),q=(w[1]*v[0]-w[0]*v[1])/(distance*distance);
 return {base:a.fix,point:a.point,k,q,scale:Math.hypot(k,q),error:Math.max(a.fix.accuracy,b.fix.accuracy),created:Date.now()};
}
export function project(fix,alignment){const [x,y]=localMetres(fix,alignment.base);return [alignment.point[0]+alignment.k*x-alignment.q*y,alignment.point[1]+alignment.q*x+alignment.k*y];}
export function usable(fix,alignment,now=Date.now()){
 if(!fix)return 'Waiting for your phone';
 if(now-fix.timestamp>15000)return 'Location is stale. Waiting for a fresh signal';
 if(!alignment)return 'Align the floor plan to enable indoor positioning';
 if(fix.accuracy>10)return `Signal too imprecise for indoor guidance (±${Math.round(fix.accuracy)} m)`;
 const [x,y]=project(fix,alignment);
 if(x<0||x>925||y<40||y>400)return 'Your location is outside the aligned floor plan';
 return null;
}
