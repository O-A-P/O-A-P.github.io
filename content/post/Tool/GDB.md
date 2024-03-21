---
title: "GDB命令"
date: 2023-07-08T15:27:53+08:00
categories: ['Tool', 'GDB', 'Linux']
draft: false
summary: '按gdb进入GDB'
images: ['/img/Tool/tui.png', '/img/Tool/gdb.png']
---
# 1. GDB是什么
GDB（GNU Debugger）是GNU项目的调试器，支持Ada、Assembly、C、C++、D、Fortran、Go、Objective-C、OpenCL、Modula-2、Pascal、Rust

gbdinit和gdb中的python什么的还得了解一下

可以写个`.gdbinit`来使得每次使用gdb都自动打开图形模式，可以执行`gdb -q`来省略开头的提醒信息！

另外gdb还支持反向调试，具体得先`record`一下，指令前面要加`reverse-`
# 2. GDB基础指令
## 2.1 断点设置
使用GDB的前提是程序带有调试信息（`gcc -g`），如果没有调试信息使用gdb则会显示：

![](/img/Tool/noDebuggingSymbols.png )

- 如果程序已经运行且还想调试的话，可以采用`ps -ef | grep 进程名`的方式来找到已运行程序的pid，进而使用`attach pid`的方式进行调试：`gdb a.out -p pid`
- 如果程序已经运行且没有调试信息还想调试的话，可以保持代码不动，生成一版带有调试信息的程序，再进gdb，后使用`file 可执行程序名`的方式进行读写，然后使用`attach pid`进行链接调试
- 直接`gdb 可执行程序`
- 调试`core文件`

一般来讲第一个命令都可以直接使用首字母，且gdb命令行有自动补全，常见断点命令如下:
![](/img/Tool/breakpoint.png)
## 2.2 查看变量/信息
1. 主动通过`print`来查看变量：
![](/img/Tool/print.png)
2. 如果想查看内存可以通过`examine`来查看：
![](/img/Tool/examine.png)
3. 如果希望程序中断时自动显示某个变量的值可以使用`display`命令，相关命令如下：
![](/img/Tool/display.png)
4. 堆栈/线程/栈帧/变量设置：
![](/img/Tool/stack.png)
5. 打印各种信息：
![](/img/Tool/info.png)
## 2.3 单步调试
![](/img/Tool/step.png)
## 2.4 多进程调试
![](/img/Tool/multiProcess.png)
## 2.5 多线程调试
![](/img/Tool/multiThread.png)
## 2.6 查看源码
![](/img/Tool/list.png)
## 2.7 TUI界面
![](/img/Tool/layout.png)

{{< simple-notice simple-notice-info >}}
Ctrl L可以刷新错位的GDB窗口
{{< /simple-notice >}}
# 3. 杂
1. coredump

当进程崩溃时，操作系统会把进程当前的所有内存和寄存器状态信息保存到`core dump`文件中。Core dump file 是一个二进制文件，需要配合 debug info 来赋予其含义。GDB 可以读取 core dump 文件，协助分析进程崩溃的瞬间发生了什么。

生成coredump文件必须要设置：`ulimit -c unlimited`

生成的文件所在目录可以通过：`cat /proc/sys/kernel/core_pattern`查看

最终调试还是需要原可执行程序参与：`gdb ddd /mnt/wslg/dumps/core.ddd`

程序会停在崩溃的前一行！

参考：[1](https://senlinzhan.github.io/2017/12/31/coredump/)

2. ABI

ABI代表应用程序二进制接口（`Application Binary Interface`）。ABI定义了编译器、链接器和操作系统之间的接口规范，确保不同的软件组件可以相互操作和交互。

ABI在计算机系统中起到了关键的作用。它规定了二进制程序的格式、函数调用约定、寄存器使用、内存布局等方面的规范。通过遵循共同的ABI，不同的软件模块可以在同一操作系统上运行，并且可以相互调用和交换数据，而不需要关注底层实现的细节。

不同的操作系统和处理器架构通常有不同的ABI。例如，x86架构的ABI与ARM架构的ABI可能存在差异。同样，不同的操作系统也可以有自己的ABI，如Windows的ABI与Linux的ABI可能有所不同。

使用一致的ABI有助于跨平台开发、库的兼容性和代码的可移植性。它还为操作系统提供了与应用程序进行交互的标准接口，包括系统调用、异常处理和动态链接等。

3. 执行外部命令

在 GDB（GNU 调试器）中，`!`是一个前缀，用于在GDB命令中执行外部命令。当你在GDB的命令行中输入 ! 后跟一个外部命令，GDB 将会在操作系统的命令行执行该命令，并将其输出显示在 GDB 的命令行界面上。

这个功能使得你可以在调试过程中方便地执行一些操作系统级别的命令，如查看文件列表、运行其他程序等。通过在 GDB 中执行外部命令，你可以在不离开调试环境的情况下获取更多的信息或执行其他必要的操作。

例如可以先使用`i inferiors`查看进程信息，再通过gdb中`!pmap pid`显示一个进程的内存使用情况，包括代码段、数据段、堆、栈以及共享库等的映射情况。
# 5. 参考网站
1. [GDB调试指南](https://www.yanbinghu.com/2019/04/20/41283.html)
2. [💻【Linux】GDB 入门笔记](https://imageslr.com/2023/gdb#%E5%AD%A6%E4%B9%A0%E8%B5%84%E6%BA%90)
3. [GDB手册](https://sourceware.org/gdb/onlinedocs/gdb/)
4. [GitBook – Knowledge management simplified](https://www.gitbook.com/book/wizardforcel/100-gdb-tips)
5. [CS107 GDB教程](https://web.archive.org/web/20220608085231/https://web.stanford.edu/class/archive/cs/cs107/cs107.1202/resources/gdb)
