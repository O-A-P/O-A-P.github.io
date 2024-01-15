@echo off

REM 删除 docs 文件夹
@REM rmdir /s /q docs

REM 运行 hugo 重新生成 public 文件夹
hugo --cleanDestinationDir

@REM REM 将 public 文件夹重命名为 docs
@REM rename public docs

REM 执行 git add、git commit 和 git push
git add .
git commit -m "backup!"
git push -f

cd ./public
git add .
git commit -m "update!"
git push -f

