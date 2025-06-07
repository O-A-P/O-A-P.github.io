hugo --cleanDestinationDir

git add .
git commit -m "backup!"
git push -f origin master:master


cd ./public
git add .
git commit -m "update!"
git push -f origin master:gh-pages