/**
 * Sunrise/sunset script. By Matt Kane. Adopted for NPM use by Alexey Udivankin.
 *
 * Based loosely and indirectly on Kevin Boone's SunTimes Java implementation
 * of the US Naval Observatory's algorithm.
 *
 * Copyright © 2012 Triggertrap Ltd. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under the terms of the GNU Lesser General
 * Public License as published by the Free Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful,but WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License for more
 * details.
 * You should have received a copy of the GNU Lesser General Public License along with this library; if not, write to
 * the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA,
 * or connect to: http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html
 */
var SunriseSunsetJS=function(t){"use strict";var e=90.8333;function n(t){return Math.sin(2*t*Math.PI/360)}function a(t){return 360*Math.acos(t)/(2*Math.PI)}function r(t){return Math.cos(2*t*Math.PI/360)}function u(t,e){var n=t%e;return n<0?n+e:n}function i(t,e,i,o,M){var h,c,f=function(t){return Math.ceil((t.getTime()-new Date(t.getFullYear(),0,1).getTime())/864e5)}(M),s=e/15,l=i?f+(6-s)/24:f+(18-s)/24,g=.9856*l-3.289,v=u(g+1.916*n(g)+.02*n(2*g)+282.634,360),P=.91764*(h=v,Math.tan(2*h*Math.PI/360));c=u(c=360/(2*Math.PI)*Math.atan(P),360),c+=90*Math.floor(v/90)-90*Math.floor(c/90),c/=15;var D,I=.39782*n(v),S=r((D=I,360*Math.asin(D)/(2*Math.PI))),d=(r(o)-I*n(t))/(S*r(t)),w=u((i?360-a(d):a(d))/15+c-.06571*l-6.622-e/15,24),T=Date.UTC(M.getFullYear(),M.getMonth(),M.getDate());return new Date(T+36e5*w)}return t.getSunrise=function(t,n,a){return void 0===a&&(a=new Date),i(t,n,!0,e,a)},t.getSunset=function(t,n,a){return void 0===a&&(a=new Date),i(t,n,!1,e,a)},Object.defineProperty(t,"__esModule",{value:!0}),t}({});