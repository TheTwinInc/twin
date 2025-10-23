# 3. Add a feature branch

# This is a temporary branch where changes are made, while no change shall be ever made directly to master or develop.
# Linux
feature_name=wsSocketSubject
git checkout -b $feature_name master
# Windows
set feature_name=wsSocketSubject
git checkout -b %feature_name% master

# Do changes
git commit -a -m "message closes #1, closes #3"

# Incorporating a finished feature on master
# Linux
git checkout master
git merge --no-ff $feature_name  
git branch -d $feature_name
# Windows
git checkout master
git merge --no-ff %feature_name% 
git branch -d %feature_name%

# Push changes
git push origin master

