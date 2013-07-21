mkdir -p client
cp -r node_modules client/
cp *.js client/
sed -i 's/var _ =.*//g' client/mars.js
sed -i 's/var _ =.*//g' client/redcode-asm.js
webmake client/frontend.js ../angular/app/vendor/mars.js --name=mars
