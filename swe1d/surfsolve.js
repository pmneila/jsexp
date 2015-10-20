function roeSolver(hl,hul,hr,hur){
	if (hl<0||hr<0){
		console.log('Negative depth input :(');
	}
	var ul = (hl>hmin) ? hul/hl : 0;
	var ur = (hr>hmin) ? hur/hr : 0;

	var wl1 = ul - 2*Math.sqrt(gravity*hl);
	var wl2 = ul + 2*Math.sqrt(gravity*hl);
	var wr1 = ur - 2*Math.sqrt(gravity*hr);
	var wr2 = ur + 2*Math.sqrt(gravity*hr);

	var uhat = 0.5*(ul+ur);
	var hhat = 0.25*Math.pow(Math.sqrt(hl)+Math.sqrt(hr),2);

	var l1 = uhat - Math.sqrt(gravity*hhat);
	var l2 = uhat + Math.sqrt(gravity*hhat);
	var l1l = ul - Math.sqrt(gravity*hl);
	var l2l = ul + Math.sqrt(gravity*hl);
	var l1r = ur - Math.sqrt(gravity*hr);
	var l2r = ur + Math.sqrt(gravity*hr);

	var ws1,ws2
	if (l1>0){
		ws1 = wl1;
		ws2 = wl2;
	}
	else{
		ws1 = wr1;
		ws2 = (l2>0) ?  wl2 : wr2;
	}
	var us = 0.5*(ws1+ws2);
	var hs = (ws2-ws1)*(ws2-ws1)/(16*gravity);

	if (l1l<0 && l1r > 0){
		us = uhat;
		hs = hhat;
	}
	if (l2l<0 && l2r >0){
		us = uhat;
		hs = hhat;
	}

	if (hs<0){
		console.log('Negative depth :( output');
	}
	return [hs,us];
}

function flux(h,u){
	return [h*u, 0.5*gravity*h*h + h*u*u];
}

function fluxes(water){
	/*Calculates fluxes along cells interfaces
	Return flux array for interface between
	cells i,i+1, for i = 0 to nx-1
	*/
	var nx = water.h.length;
	var f = new Array(nx-1); //nx-1 times 2
	for (var i=0; i<nx-1; i++){
		if (i==nx-3){
			console.log(i);
		}
		var hs_us = roeSolver(
			water.h[i],water.xmomentum[i],
			water.h[i+1],water.xmomentum[i+1]);
		f[i] = flux(hs_us[0],hs_us[1]);
	}
	return f;
}

function bcs_closed(water){
	var hnew = water.h.slice();
	var hunew = water.xmomentum.slice();
	var nx = water.h.length
	hnew[0] = water.h[1];
	hunew[0] = -water.xmomentum[1];
	hnew[nx-1] = water.h[nx-2];
	hunew[nx-1] = -water.xmomentum[nx-2];
	water.h = hnew.slice();
	water.xmomentum = hunew.slice();
}

function setdt(water){
	/* h,hu arrays of length nx
	 dx,cfl floats */
	var s = 0.;	
	var nx = water.h.length;
	var u = new Array(nx);
	for (var i=0; i<nx; i++){
		u[i] = (water.h[i]> hmin) ? water.xmomentum[i]/water.h[i] : 0;
		var sloc = Math.abs(u[i])+Math.sqrt(gravity*water.h[i]);
		s = (sloc>s) ? sloc : s;
	}
	var dt = water.cfl*water.dx/s;
	return dt;
}

function simulate(water,bcs){

	var tobj = water.t + simStep/1000;
	// while (water.t < tobj){
		var dt = setdt(water);
		//dt = Math.min(dt,simStep);
		var dx = water.dx;
		var cfl = water.cfl;
		bcs(water);
		var f = fluxes(water);

		water.t += dt;
		water.nstep++;
		// console.log(water.t,dt);
		if (water.h.slice(water.n-5)[0]>0){
		console.log(water.h.slice(water.n-5));
		console.log(water.xmomentum.slice(water.n-5));		
		console.log('-------------');	
		}
		for (var i = 1; i< water.h.length-1; i++){
			if(isNaN(water.h[i])){
				console.log(h[i],h[i-1],i,water.n)
			}
			if(i==water.h.length-2){
				console.log(i);
			}

			water.h[i] = water.h[i] -dt/dx*(f[i][0]-f[i-1][0]);
			water.xmomentum[i] = water.xmomentum[i] -dt/dx*(f[i][1] - f[i-1][1]);
			if(water.h[i]<0){
				console.log(i,h[i],h[i-1]);
				console.log('asdf')
			}
		}
		water.surface = water.h.slice();
		water.disp_surface = water.surface.map(world2canvas_y);
	// }
}