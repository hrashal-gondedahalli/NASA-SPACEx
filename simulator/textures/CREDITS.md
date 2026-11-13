# Earth surface imagery

`earth-blue-marble.jpg` is the unmodified 2048 x 1024 Earth surface texture from the Three.js r170 examples:
https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/textures/planets/earth_atmos_2048.jpg
https://github.com/mrdoob/three.js/blob/r170/examples/textures/planets/earth_atmos_2048.jpg

NASA Blue Marble background and credit:
https://science.nasa.gov/resource/blue-marble/

Credit: NASA Goddard Space Flight Center; Reto Stöckli (land, shallow water, clouds); Robert Simmon (ocean colour, compositing and globe enhancements). The texture is an archived composite, not live imagery. The simulated launch site, atmosphere and simplified ground disc are game visuals, not current Earth observations. Three.js MIT license is included in `../vendor/THREE-LICENSE.txt`.

## Moon surface and orbital reference

`moon-surface.jpg` is the unmodified 1024 x 512 Moon texture distributed in the Three.js r170 examples (238,093 bytes):
https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/textures/planets/moon_1024.jpg
https://github.com/mrdoob/three.js/blob/r170/examples/textures/planets/moon_1024.jpg

Distribution reference and license: Three.js examples and bundled MIT license. The texture's original imaging provenance is not asserted here. NASA's LRO CGI Moon Kit is a scientific visualization reference, not the downloaded asset: https://svs.gsfc.nasa.gov/4720/. The local crater field and textured ground disc are decorative landmarks; they are not surveyed lunar terrain or a terrain collision model.

Mean orbit parameters: NASA NSSDCA Moon Fact Sheet, https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html (accessed 2026-11-13). Semimajor axis 384,400 km, eccentricity 0.0549, inclination to the ecliptic 5.145°, real sidereal period 27.3217 days. Positions use Kepler's equation with an arbitrary initial phase; no real-time ephemeris, precession or gravitational perturbations. Sizes and distances are 1:10; display orbital period is computed from the model gravitational parameters, approximately sqrt(0.1) times the real period. Moon motion is a visual reference; rocket flight retains its current single-body gravity.
