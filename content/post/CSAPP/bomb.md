---
title: "CSAPP：bomb lab"
date: 2024-02-20T20:48:54+08:00
summary: '开始你的炸弹秀'
categories: ['x86-asm', 'CSAPP']
images: ['/img/CSAPP/bomb.png', '/img/CSAPP/lbw.jpg']
---
{{< simple-notice simple-notice-note >}}
题意很简单，题目给出一个二进制可执行文件，要求通过反汇编等一系列破解六个密码。
密码都被封装到phase_1~phase_6六个函数中，如果输入错误则会引爆。

前置准备：先用如下指令把汇编输出到文件里，用vscode看看

`objdump -d bomb > bomb.asm`

然后记住六个参数是：

`rdi rsi rdx rcx r8 r9`，第七个参数就是通过栈来传递，返回参数在rax中
{{< /simple-notice >}}

# 1. phase_1
首先还是得看看汇编，其汇编如下：

```asm
0000000000400ee0 <phase_1>:
  400ee0:   48 83 ec 08             sub    $0x8,%rsp
  400ee4:   be 00 24 40 00          mov    $0x402400,%esi
  400ee9:   e8 4a 04 00 00          callq  401338 <strings_not_equal>
  400eee:   85 c0                   test   %eax,%eax
  400ef0:   74 05                   je     400ef7 <phase_1+0x17>
  400ef2:   e8 43 05 00 00          callq  40143a <explode_bomb>
  400ef7:   48 83 c4 08             add    $0x8,%rsp
  400efb:   c3                      retq  
```


几乎是明牌了，第二行为函数开辟栈空间，mov指令把地址0x402400放到寄存器esi中，随后调用strings_not_equal这个函数（第一个第二个传入参数会被分别放到rdi和rsi两个寄存器中），由于知道x86把返回值放到rax寄存器中，后面会有一个判断结果的流程，再往后就是引爆炸弹了。
根据流程分析代码应该如下：
```c
void phase_1(char* input) {
    char* a = "123123123";    // 这里只是代指，并非真正密码
    if(strings_not_equal(a, input)) {
        explode_bomb();
    }
}
```
所以思路很明显了，直接`gdb ./bomb`，查看一下`0x402400`处内存就OK，具体如下：
```bash
(gdb) x/s 0x402400
0x402400:       "Border relations with Canada have never been better."
```
这里`x/s`表示按字符串查看指定位置内存（妈的之前不知道还一个个查表，真蠢）
最后在运行`bomb`输入密码即可，不带引号
# 2. phase_2
这里直接给出注释：
```asm
0000000000400efc <phase_2>:
  400efc:   55                      push   %rbp                     # 压栈两个要用到的寄存器
  400efd:   53                      push   %rbx
  400efe:   48 83 ec 28             sub    $0x28,%rsp               # 为函数开辟空间
  400f02:   48 89 e6                mov    %rsp,%rsi                # 把栈指针用作函数参数
  400f05:   e8 52 05 00 00          callq  40145c <read_six_numbers># 字面意义上从input中读取6个数字，可以想象数字被读取之后一定是存在栈上的（考虑到局部变量通过栈传递，以及上面一行把rsp传入该函数）
  400f0a:   83 3c 24 01             cmpl   $0x1,(%rsp)              # 比较rsp寄存器所指的数据与1大小，那么此时rsp所指的位置必然存在六个数字，这里将第一个数字和1比较。
  400f0e:   74 20                   je     400f30 <phase_2+0x34>    # 如果相等就跳转到30位置上
  400f10:   e8 25 05 00 00          callq  40143a <explode_bomb>    # 否则就引爆
  400f15:   eb 19                   jmp    400f30 <phase_2+0x34>    # 引爆后再跳到30位置上
  400f17:   8b 43 fc                mov    -0x4(%rbx),%eax          # 将地址rbx-4内存处数据移动到eax，如果是第一次到此处，那此时eax中就是第一个数字，也就是1
  400f1a:   01 c0                   add    %eax,%eax                # 将eax乘以2
  400f1c:   39 03                   cmp    %eax,(%rbx)              # 将eax数据与rbx指向数据比较，如果是第一次到此处，那这行的意思就是把第一个数字的二倍和第二个数字比较
  400f1e:   74 05                   je     400f25 <phase_2+0x29>    # 相等跳到25位置，此时可以确认，要求是让第一个数字的两倍和第二个数字相等，依次递增
  400f20:   e8 15 05 00 00          callq  40143a <explode_bomb>    # 否则引爆
  400f25:   48 83 c3 04             add    $0x4,%rbx                # 将rbx中数据加4，若第一次到此处，那此时指向第三个数字
  400f29:   48 39 eb                cmp    %rbp,%rbx                # 比较rbx和rbp中的地址数据，控制循环次数
  400f2c:   75 e9                   jne    400f17 <phase_2+0x1b>    # 如果不相等就跳转到17位置，继续循环
  400f2e:   eb 0c                   jmp    400f3c <phase_2+0x40>    # 相等就跳转到3c位置，停止循环
  400f30:   48 8d 5c 24 04          lea    0x4(%rsp),%rbx           # 将0x4和rsp加起来将其中地址赋值给rbx，如果是第一次到此处，那么rbx保存的就是第二个数字的地址
  400f35:   48 8d 6c 24 18          lea    0x18(%rsp),%rbp          # 将0x18和rsp加起来将其中地址赋值给rbp，0x18=4*6=24，因此指向最后一个元素的末尾！
  400f3a:   eb db                   jmp    400f17 <phase_2+0x1b>    # 跳转到17位置
  400f3c:   48 83 c4 28             add    $0x28,%rsp               # 恢复栈
  400f40:   5b                      pop    %rbx                     # 恢复寄存器
  400f41:   5d                      pop    %rbp
  400f42:   c3                      retq   
```
刚开始压栈和开辟空间没什么好说的，但需要注意这里开辟了`0x28`大小的空间，这相当的大，下一步把`rsp传给了rsi`，也就是第二个参数寄存器，从C代码中可以看到phase都只有一个参数，因此rsi没用上。

但后续调用`read_six_numbers`显然是用上了这个rsi，从字面意思来看，要从input读取六个数字，那返回值要放在哪里呢？`显然没有放在堆上，而是通过第二参数放在了其指向的地址上，也就是栈上！`

下一步是将rsp所指的数据和1比较，显然rsp指向六个中的第一个，那第一个数字必然是1。后面跳转到指定位置上，具体的步骤是将rbx指向了下一个数字，将rbp指向了最后一个数字的末尾！随后继续跳转。

后面跳转到的是获取上一个数字并将其乘以2与自己比较，那很明显就是当前数字必须是前一个数字的两倍，随后跳转到循环的判断语句上，判断是否到达了循环次数！

由此可见类似的C代码应该是：
```c
void phase_2(char *input) {
    int a[6];
    read_six_numbers(input, a);
    if (a[0] != 1) explode_bomb(); 
    for (int i = 1; i < 6; i++) {
        if(a[i] != 2 * a[i - 1]) {
            explode_bomb();
        }
    }
}
```
所以显而易见，要输入的密码应该是`1 2 4 8 16 32 64`
# 3. phase_3
同样给出注释
```asm
0000000000400f43 <phase_3>:
  400f43:   48 83 ec 18             sub    $0x18,%rsp                   # 预留空间
  400f47:   48 8d 4c 24 0c          lea    0xc(%rsp),%rcx               # 第四参数寄存器的值是rsp+12
  400f4c:   48 8d 54 24 08          lea    0x8(%rsp),%rdx               # 第三参数寄存器的值是rsp+8，猜想可能是获取数据
  400f51:   be cf 25 40 00          mov    $0x4025cf,%esi               # 把某个地址的数据放到esi中了，而esi是第二个参数寄存器，32位，第一个参数寄存器已经放了input，从后面可知这里应该是format字符串
  400f56:   b8 00 00 00 00          mov    $0x0,%eax                    # 把0放到eax中，rax是返回值寄存器
  400f5b:   e8 90 fc ff ff          callq  400bf0 <__isoc99_sscanf@plt> # 调用sscanf函数，int sscanf(const char *str, const char *format, ...);
                                                                        # 猜想是sscanf(input, esi指向的字符串, 返回参数)，得gdb看一下format
  400f60:   83 f8 01                cmp    $0x1,%eax                    # 此时eax返回值是解析成功了几个，从gdb中可以看出是两个整形参数
  400f63:   7f 05                   jg     400f6a <phase_3+0x27>        # 如果是eax>1就跳转6a，否则爆炸
  400f65:   e8 d0 04 00 00          callq  40143a <explode_bomb>
  400f6a:   83 7c 24 08 07          cmpl   $0x7,0x8(%rsp)               # 比较四个字节，比较rsp+8位置的数据，也就是第三个参数和0x7的关系
  400f6f:   77 3c                   ja     400fad <phase_3+0x6a>        # 如果是大于就跳转ad位置，ad位置是爆炸，也就是说第三个参数不能大于7
  400f71:   8b 44 24 08             mov    0x8(%rsp),%eax               # 把第三参数放到eax中，假设第三参数是0，那就是跳转到0x402470处
  400f75:   ff 24 c5 70 24 40 00    jmpq   *0x402470(,%rax,8)           # 间接跳转0x402470内存处的地址，gdb看了，输入两个参数且第一个参数为0时是0x400f7c
  400f7c:   b8 cf 00 00 00          mov    $0xcf,%eax                   # 覆盖eax为0xcf
  400f81:   eb 3b                   jmp    400fbe <phase_3+0x7b>        # 跳转到be位置
  400f83:   b8 c3 02 00 00          mov    $0x2c3,%eax                 
  400f88:   eb 34                   jmp    400fbe <phase_3+0x7b>        
  400f8a:   b8 00 01 00 00          mov    $0x100,%eax
  400f8f:   eb 2d                   jmp    400fbe <phase_3+0x7b>
  400f91:   b8 85 01 00 00          mov    $0x185,%eax
  400f96:   eb 26                   jmp    400fbe <phase_3+0x7b>
  400f98:   b8 ce 00 00 00          mov    $0xce,%eax
  400f9d:   eb 1f                   jmp    400fbe <phase_3+0x7b>
  400f9f:   b8 aa 02 00 00          mov    $0x2aa,%eax
  400fa4:   eb 18                   jmp    400fbe <phase_3+0x7b>
  400fa6:   b8 47 01 00 00          mov    $0x147,%eax
  400fab:   eb 11                   jmp    400fbe <phase_3+0x7b>
  400fad:   e8 88 04 00 00          callq  40143a <explode_bomb>
  400fb2:   b8 00 00 00 00          mov    $0x0,%eax
  400fb7:   eb 05                   jmp    400fbe <phase_3+0x7b>
  400fb9:   b8 37 01 00 00          mov    $0x137,%eax
  400fbe:   3b 44 24 0c             cmp    0xc(%rsp),%eax               # 比较第四参数和0xcf
  400fc2:   74 05                   je     400fc9 <phase_3+0x86>        # 如果相等就跳转到c9位置结束
  400fc4:   e8 71 04 00 00          callq  40143a <explode_bomb>
  400fc9:   48 83 c4 18             add    $0x18,%rsp
  400fcd:   c3                      retq   
```
首先就搞了两个变量，显然是为了存返回数据，后续又马上调用了sscanf，查一下sscanf的函数说明：
```c
int sscanf(const char *str, const char *format, ...);    // int为成功获取参数个数
```
rsi是第二参数，可以看到第五行给了一个地址过去，用gdb查看一下发现是`%d %d`，由此不难推断出要按俩参数。

而前面搞的俩栈上变量显然是用来存储读取到的数据

eax获取解析了几个，后面如果`eax>1`则继续执行，侧面验证了要按俩参数

后续又比较第一个参数和7，大于7就会爆炸，因此第一个参数不能大于7，后续往下，根据第一个参数是什么来实行间接跳转，这里我随便写个0，转到gdb看一下跳转地址，应该是一个类似switch的东西，随后直接算出来第二个参数是`0xcf即207`

可以猜测一下C代码结构：
```c
void phase_3(char* input){
    int a, b;
    int res = sscanf(input, "%d %d", &a, &b);
    if (res <= 1) {
        explode_bomb();
    }
    if (a > 7) {
        explode_bomb();
    }
    switch(a) {
        case 0:
            if (b != 207) {
                explode_bomb();
            }
            break;
        case 1:
        ...
    }
}
```
所以正确答案是`0 207`

# 4. phase_4
首先还是先看汇编：
```asm
000000000040100c <phase_4>:
  40100c:   48 83 ec 18             sub    $0x18,%rsp                   # 预留空间
  401010:   48 8d 4c 24 0c          lea    0xc(%rsp),%rcx               # 准备第四参数
  401015:   48 8d 54 24 08          lea    0x8(%rsp),%rdx               # 准备第三参数
  40101a:   be cf 25 40 00          mov    $0x4025cf,%esi               # 第二参数，具体存的东西在0x4025cf处，和phase_3一样%d %d
  40101f:   b8 00 00 00 00          mov    $0x0,%eax                    # 清理eax
  401024:   e8 c7 fb ff ff          callq  400bf0 <__isoc99_sscanf@plt> # 调用sscanf
  401029:   83 f8 02                cmp    $0x2,%eax                    # 将成功获取参数个数与2比较
  40102c:   75 07                   jne    401035 <phase_4+0x29>        # 如果不等于就跳转35处爆炸
  40102e:   83 7c 24 08 0e          cmpl   $0xe,0x8(%rsp)               # 此时是等于2的，将获取到的第三参数与0xe比较，即第一个数字
  401033:   76 05                   jbe    40103a <phase_4+0x2e>        # 如果第三参数<=0xe就跳转3a处，否则就爆炸，所以第一个数字一定要小于等于0xe=14
  401035:   e8 00 04 00 00          callq  40143a <explode_bomb>        
  40103a:   ba 0e 00 00 00          mov    $0xe,%edx                    # 将0xe放入edx中，用作func4的第三参数
  40103f:   be 00 00 00 00          mov    $0x0,%esi                    # 将0放入esi中，用作func4的第二参数
  401044:   8b 7c 24 08             mov    0x8(%rsp),%edi               # 获取第一个数字将其放入edi中，用作func4的第一参数
  401048:   e8 81 ff ff ff          callq  400fce <func4>               # 调用func4，这里不确定func4有几个参数，但在这个函数里面至少有三个，也有可能有四个
  40104d:   85 c0                   test   %eax,%eax                    # 测试返回值是否为0
  40104f:   75 07                   jne    401058 <phase_4+0x4c>        # 如果非0就跳转爆炸
  401051:   83 7c 24 0c 00          cmpl   $0x0,0xc(%rsp)               # 是0就把第二个数字与0比较
  401056:   74 05                   je     40105d <phase_4+0x51>        # 如果相等就结束，所以第二个数字必然为0
  401058:   e8 dd 03 00 00          callq  40143a <explode_bomb>
  40105d:   48 83 c4 18             add    $0x18,%rsp
  401061:   c3                      retq   
```
可以看到，首先是准备参数，随后和phase3中一样从input中提取数字，gdb看一下也是%d %d，并且将获取成功的参数与2相比是否正确，随后检查第一个数字是否是小于14，如果是就调用func4，不是就爆炸，获取func4返回值看是否为0，是的话就比较第二个数字是否为0，是0就成功

所以显然第一个数字小于等于14，第二个数字为0

这里可以尝试一手0 0，再进func4分析，func4汇编如下：
```asm
0000000000400fce <func4>:                                           # rdi rsi rdx，第一次调用分别为: 第一个数字，0，0xe=14
  400fce:   48 83 ec 08             sub    $0x8,%rsp                # 预留空间
  400fd2:   89 d0                   mov    %edx,%eax                # 把第三参数存到eax中  eax = edx = 14
  400fd4:   29 f0                   sub    %esi,%eax                # 把eax中的第三参数减去第二参数 eax = eax - esi = 14
  400fd6:   89 c1                   mov    %eax,%ecx                # 把eax中减去第二参数的第三参数放到ecx寄存器里，从此处基本确定这个函数有三个参数 ecx = eax = 14
  400fd8:   c1 e9 1f                shr    $0x1f,%ecx               # 逻辑右移0x1f个位置存到ecx中 ecx>>0x1f（相当于取最高位的0或者1） ecx = 0
  400fdb:   01 c8                   add    %ecx,%eax                # 把ecx和eax相加存到eax中     eax = ecx + eax     eax = 14
  400fdd:   d1 f8                   sar    %eax                     # 算术右移但没写移几位，这里debug了一下发现是除以2，所以应该是取默认值为1，即右移一位         
  400fdf:   8d 0c 30                lea    (%rax,%rsi,1),%ecx       # 把rax+rsi赋值给ecx
  400fe2:   39 f9                   cmp    %edi,%ecx                # 比较edi和ecx
  400fe4:   7e 0c                   jle    400ff2 <func4+0x24>      # 如果ecx <= edi就跳转f2位置
  400fe6:   8d 51 ff                lea    -0x1(%rcx),%edx          # 否则就将rcx-1赋值给edx
  400fe9:   e8 e0 ff ff ff          callq  400fce <func4>           # 递归调用
  400fee:   01 c0                   add    %eax,%eax                # 把返回值eax * 2   相当于return 2 * func4()
  400ff0:   eb 15                   jmp    401007 <func4+0x39>      # 结束
  400ff2:   b8 00 00 00 00          mov    $0x0,%eax                # 把0赋值给eax
  400ff7:   39 f9                   cmp    %edi,%ecx                # 比较ecx和edi
  400ff9:   7d 0c                   jge    401007 <func4+0x39>      # 若 ecx>=edi，就跳转07位置
  400ffb:   8d 71 01                lea    0x1(%rcx),%esi           # 否则把rcx+1赋值给esi
  400ffe:   e8 cb ff ff ff          callq  400fce <func4>           # 递归调用
  401003:   8d 44 00 01             lea    0x1(%rax,%rax,1),%eax    # 相当于返回 2 * eax + 1  相当于return 2 * func4() + 1
  401007:   48 83 c4 08             add    $0x8,%rsp
  40100b:   c3                      retq
```
显然是个很坑的递归，可以一行行将其换成C如下，注意gdb里尝试的sar %eax不带移动位数就默认是移动1位，最终可以知道递归代码如下。一通分析发现第一个数字是0。
```c
// 第一次进入分别为：第一个数字，0，14
int func4(int a, int b, int c) {
    int tmp1 = c - b;
    int tmp2 = tmp1 >> 31;
    tmp1 = tmp2 + tmp1;
    tmp1 = tmp1 / 2;
    tmp2 = tmp1 + b;
    if (tmp2 <= a) {
       tmp1 = 0;
       if (tmp2 >= a) {
           return 0;
       } else {
           b = tmp2 + 1;
           return 2 * func4(a, b, c) + 1;
       }
    } else {
        c = tmp2 - 1;
        return 2 * func4(a, b, c);
    }
}
```
因此`第一个密码是0，第二个密码也是0`。
# 5. phase_5
老规矩查看汇编：
```asm
0000000000401062 <phase_5>:
  401062:   53                      push   %rbx                         # 后面要用到rbx，压栈
  401063:   48 83 ec 20             sub    $0x20,%rsp                   # 开辟空间
  401067:   48 89 fb                mov    %rdi,%rbx                    # 把input放到rbx中。rbx和rdi都指向input
  40106a:   64 48 8b 04 25 28 00    mov    %fs:0x28,%rax                # ？似乎是把什么玩意放到rax中
  401071:   00 00 
  401073:   48 89 44 24 18          mov    %rax,0x18(%rsp)              # 把rax寄存器的数据放到栈中，也就是金丝雀值
  401078:   31 c0                   xor    %eax,%eax                    # 将eax清零
  40107a:   e8 9c 02 00 00          callq  40131b <string_length>       # 显然是获取字符串长度，将结果返回到eax中
  40107f:   83 f8 06                cmp    $0x6,%eax                    # 比较字符串长度和6
  401082:   74 4e                   je     4010d2 <phase_5+0x70>        # 如果相等就跳转d2位置，也就是说字符串长度得是6

  401084:   e8 b1 03 00 00          callq  40143a <explode_bomb>        # 否则爆炸
  401089:   eb 47                   jmp    4010d2 <phase_5+0x70>

  40108b:   0f b6 0c 03             movzbl (%rbx,%rax,1),%ecx           # 将rbx+rax所指向的数据放到ecx中，rbx指向input，rax从0到5，也就是第一个字符
  40108f:   88 0c 24                mov    %cl,(%rsp)                   # 将该字符压入栈上
  401092:   48 8b 14 24             mov    (%rsp),%rdx                  # 把该字符放入rdx中
  401096:   83 e2 0f                and    $0xf,%edx                    # 0xf与第一个字符做与操作，再把结果存到edx中，相当于只保留低4位
  401099:   0f b6 92 b0 24 40 00    movzbl 0x4024b0(%rdx),%edx          # 再把保留低4位的值 + 0x4024b0所指向的数据放回edx中，gdb查看一手
                                                                        # 查看结果如下：maduiersnfotvbylSo you think you can stop the bomb with ctrl-c, do you?
  4010a0:   88 54 04 10             mov    %dl,0x10(%rsp,%rax,1)        # 把获取到的字符放到，0x10+rsp+rax所指向的地址，而rax从0到5，因此放入的位置是rsp+0x10到rsp+0x15
  4010a4:   48 83 c0 01             add    $0x1,%rax                    # 把rax+1
  4010a8:   48 83 f8 06             cmp    $0x6,%rax                    # 比较rax和6的大小
  4010ac:   75 dd                   jne    40108b <phase_5+0x29>        # 如果不相等就回退到8b位置，所以这是个循环

  4010ae:   c6 44 24 16 00          movb   $0x0,0x16(%rsp)              # 相等就把栈上0x16位置赋值为0，相当于结束符
  4010b3:   be 5e 24 40 00          mov    $0x40245e,%esi               # 把0x40245e赋值给%esi，gdb查看了一下发现是：flyers
  4010b8:   48 8d 7c 24 10          lea    0x10(%rsp),%rdi              # 把rsp + 0x10赋值给rdi
  4010bd:   e8 76 02 00 00          callq  401338 <strings_not_equal>   # 调用函数，显然有俩参数
  4010c2:   85 c0                   test   %eax,%eax                    # 比较返回值是否相等
  4010c4:   74 13                   je     4010d9 <phase_5+0x77>        # 如果相等就跳转到d9位置结束
  4010c6:   e8 6f 03 00 00          callq  40143a <explode_bomb>        
  4010cb:   0f 1f 44 00 00          nopl   0x0(%rax,%rax,1)             # 无用
  4010d0:   eb 07                   jmp    4010d9 <phase_5+0x77>      

  4010d2:   b8 00 00 00 00          mov    $0x0,%eax                    # 将eax置零
  4010d7:   eb b2                   jmp    40108b <phase_5+0x29>        # 跳转到8b位置

  4010d9:   48 8b 44 24 18          mov    0x18(%rsp),%rax              # 把rax寄存器的数据恢复
  4010de:   64 48 33 04 25 28 00    xor    %fs:0x28,%rax                # 比较金丝雀值
  4010e5:   00 00 
  4010e7:   74 05                   je     4010ee <phase_5+0x8c>        # 如果相等就跳出，否则就继续
  4010e9:   e8 42 fa ff ff          callq  400b30 <__stack_chk_fail@plt>
  4010ee:   48 83 c4 20             add    $0x20,%rsp
  4010f2:   5b                      pop    %rbx
  4010f3:   c3                      retq   
  ```
这题倒也简单，一看就知道是个循环，主要代码分为三部分：
1. 判断输入字符串的长度，从上面可以看出，如果不是6个字符就会爆炸
2. 循环六个字符的低四位，并以此为索引从内存中找到六个对应字符，也就是从那一大串中找，并把六个对应字符存到栈上
3. 将栈上六个字符与另外六个字符（`flyers`）相比较，如果不同就爆炸！
以第一个字符f为例，要找到这个字符，偏移量必须为9，大小写的I都可以做到，后续按照规律分别可以找到：`IONEFG`，大小写皆可，哪怕不是这些字符都OK，只要是ascii码低四位偏移量能够找到目标字符即可。
# 6. phase_6
这一关比较难，分段分析：
```asm
00000000004010f4 <phase_6>:
  4010f4:   41 56                   push   %r14                 # 压栈一些寄存器
  4010f6:   41 55                   push   %r13
  4010f8:   41 54                   push   %r12
  4010fa:   55                      push   %rbp
  4010fb:   53                      push   %rbx
  4010fc:   48 83 ec 50             sub    $0x50,%rsp           # 保留一段栈用于该函数
  401100:   49 89 e5                mov    %rsp,%r13            # 把rsp存到r13中，r13= rsp
  401103:   48 89 e6                mov    %rsp,%rsi            # 再把rsp存到rsi中
  401106:   e8 51 03 00 00          callq  40145c <read_six_numbers> # rdi是input，rsi是rsp，所以是从input中读取六个数字到栈上
  40110b:   49 89 e6                mov    %rsp,%r14            # 把rsp存到r14中 r14 = rsp
  40110e:   41 bc 00 00 00 00       mov    $0x0,%r12d           # 将r12置零 r12 = 0

  401114:   4c 89 ed                mov    %r13,%rbp            # 将r13的数据置给rbp，也就是说使得rbp = rsp，rbp = rsp + 4（第二次）
  401117:   41 8b 45 00             mov    0x0(%r13),%eax       # 获取第一个数字，传给eax | 获取第二个数字
  40111b:   83 e8 01                sub    $0x1,%eax            # 将第一个数字-1 | 第二个数字-1
  40111e:   83 f8 05                cmp    $0x5,%eax            # 与5比较
  401121:   76 05                   jbe    401128 <phase_6+0x34># 如果 数字-1 <= 5，就跳转28处，这说明数字必须小于等于6
  401123:   e8 12 03 00 00          callq  40143a <explode_bomb>
  401128:   41 83 c4 01             add    $0x1,%r12d           # 给r12+1，此时r12 = 1
  40112c:   41 83 fc 06             cmp    $0x6,%r12d           # 将r12与6比较
  401130:   74 21                   je     401153 <phase_6+0x5f># 如果相等就跳转53
  401132:   44 89 e3                mov    %r12d,%ebx           # 将r12的值放入ebx，ebx = 1

  401135:   48 63 c3                movslq %ebx,%rax            # 将ebx的值放入rax，rax = 1
  401138:   8b 04 84                mov    (%rsp,%rax,4),%eax   # 将rsp+4*rax指向的数据放入eax，也就是第二个数据
  40113b:   39 45 00                cmp    %eax,0x0(%rbp)       # 比较eax和第一个数字，比较第一二个数字
  40113e:   75 05                   jne    401145 <phase_6+0x51># 如果不相等就跳转45处，也就是说让第1 2个数字不相等
  401140:   e8 f5 02 00 00          callq  40143a <explode_bomb>
  401145:   83 c3 01                add    $0x1,%ebx            # ebx = 2
  401148:   83 fb 05                cmp    $0x5,%ebx            # 将ebx与5比较
  40114b:   7e e8                   jle    401135 
  <phase_6+0x41># ebx <= 5就跳转35处，所以此处是个循环，循环比较其他数字和第一个数字，让所有数字都不与第一个数字相同
  ```
这一段的意思很简单，就是从input中读6个数字，将其与6比较，保证每个数字都小于等于6.

同时后面有个双层循环，使得6个数字互不相等。所以按照推测后面的代码应该是决定这六个数字的顺序
```asm
  40114d:   49 83 c5 04             add    $0x4,%r13            # r13等于rsp，相当于让r13指向第二个数字
  401151:   eb c1                   jmp    401114 <phase_6+0x20># 这里也是循环，相当于让每个数字都相互比较，使之个个都不相等，且小于等于6
                                                                
  401153:   48 8d 74 24 18          lea    0x18(%rsp),%rsi      # 把rsp+18地址给rsi，也就是最后一个元素
  401158:   4c 89 f0                mov    %r14,%rax            # 让rax = r14 = rsp
  40115b:   b9 07 00 00 00          mov    $0x7,%ecx            # 让ecx = 0x7

  401160:   89 ca                   mov    %ecx,%edx            # 让edx = ecx = 0x7
  401162:   2b 10                   sub    (%rax),%edx          # 让0x7 - 第一个元素
  401164:   89 10                   mov    %edx,(%rax)          # 把结果再放到原位置
  401166:   48 83 c0 04             add    $0x4,%rax            # 移动到下一个元素
  40116a:   48 39 f0                cmp    %rsi,%rax            # 比较是否到达最后一个元素
  40116d:   75 f1                   jne    401160 <phase_6+0x6c># 如果没到就跳转到60处，继续这个循环，相当于让每个数字=0x7-数字

  40116f:   be 00 00 00 00          mov    $0x0,%esi            # esi = 0
  401174:   eb 21                   jmp    401197 <phase_6+0xa3># 跳转到97处，此时上一个循环完毕开启下一个循环
```
让每个数字都等于7-数字，目前尚且不知道有啥用
```asm
  401176:   48 8b 52 08             mov    0x8(%rdx),%rdx       # rdx存储rdx+0x8处的数据，这里一直不明白，看了别人的解析才懂原来是链表操作
                                                                # 相当于把下一个节点的指针放到rdx里
  40117a:   83 c0 01                add    $0x1,%eax            # 让eax++，eax随着循环内部循环增长，比较其与大于1的元素的关系
  40117d:   39 c8                   cmp    %ecx,%eax            # 比较ecx和eax，而ecx是大于1的元素
  40117f:   75 f5                   jne    401176 <phase_6+0x82># 如果不相等就跳转76，继续让rdx前进，同时让eax+1，也就是找到存放指定数据的节点
  401181:   eb 05                   jmp    401188 <phase_6+0x94># 反之跳转88，也就是说找到和数字匹配的链表节点

  401183:   ba d0 32 60 00          mov    $0x6032d0,%edx       # 又让edx存了该地址，小于1的逻辑，gdb看了一下，这是链表head地址
  401188:   48 89 54 74 20          mov    %rdx,0x20(%rsp,%rsi,2)# 让rdx放到rsp + 0x20 + rsi * 2处。
                                                                # 说明栈中元素大小是8，也就是说栈上存的是指针，这里就是把每个节点的指针保存下来，保存到栈上
  40118d:   48 83 c6 04             add    $0x4,%rsi            # 让rsi移动4
  401191:   48 83 fe 18             cmp    $0x18,%rsi           # 比较rsi与0x18，24是终点，说明要移动6次到达终点
  401195:   74 14                   je     4011ab <phase_6+0xb7># 如果相等就跳转ab处，显然一开始不会相等，所以要循环

  401197:   8b 0c 34                mov    (%rsp,%rsi,1),%ecx   # 使得ecx的值为rsp + rsi指向处，猜测也是移动指针，此时ecx中保存第一个元素，第二次进来就是第二个数据
  40119a:   83 f9 01                cmp    $0x1,%ecx            # 比较第一个元素与1  比较第二个数据
  40119d:   7e e4                   jle    401183 <phase_6+0x8f># 如果ecx <= 0x1，就跳转83位置，也就是说该循环比较每个元素与1的大小，所以83处是<=1的处理逻辑

  40119f:   b8 01 00 00 00          mov    $0x1,%eax            # eax = 1，这是大于1的处理逻辑
  4011a4:   ba d0 32 60 00          mov    $0x6032d0,%edx       # edx存的是0x6032d0这个地址
  4011a9:   eb cb                   jmp    401176 <phase_6+0x82># 跳转76处
```
这里出现了一个地址0x6032d0，用gdb查看一下其内存数据，发现是链表，很显然可以看到低地址是数据，高地址是指针。这里要注意第一行的数据其实就是跑到移动到下一个节点。
```bash
(gdb) x/12xg 0x6032d0
0x6032d0 <node1>:       0x000000010000014c      0x00000000006032e0
0x6032e0 <node2>:       0x00000002000000a8      0x00000000006032f0
0x6032f0 <node3>:       0x000000030000039c      0x0000000000603300
0x603300 <node4>:       0x00000004000002b3      0x0000000000603310
0x603310 <node5>:       0x00000005000001dd      0x0000000000603320
0x603320 <node6>:       0x00000006000001bb      0x0000000000000000
```
此处逻辑就是把链表中每个节点的地址按照六个数字的顺序放入栈中
```asm
                                                                # 代码到达此处之前已经完成了寻找操作，此时从rsp+0x20处开始都是指针数据，大小为8字节
  4011ab:   48 8b 5c 24 20          mov    0x20(%rsp),%rbx      # 把rsp+0x20处的数据放到rbx中       也就是说是第一个节点内的数据
  4011b0:   48 8d 44 24 28          lea    0x28(%rsp),%rax      # 让0x28+rsp放到rax处 循环开始位置  也就是说是第二个节点的地址
  4011b5:   48 8d 74 24 50          lea    0x50(%rsp),%rsi      # 让0x50+rsp放到rsi处 循环结束位置  最后一个位置
  4011ba:   48 89 d9                mov    %rbx,%rcx            # rcx = rsp + 0x20处的数据。        也就是第一个节点内的数据

  4011bd:   48 8b 10                mov    (%rax),%rdx          # 取第二个节点数据，将其放到rdx中
  4011c0:   48 89 51 08             mov    %rdx,0x8(%rcx)       # 其实就是把节点重新连接了起来，按照在栈中的顺序，得偏移8个字节才能找到指向下一个节点的指针
  4011c4:   48 83 c0 08             add    $0x8,%rax            # 把rax数据+8 rax = 0x30 + rsp，移动循环变量 
  4011c8:   48 39 f0                cmp    %rsi,%rax            # 比较rsi和rax，看看是否到了结尾
  4011cb:   74 05                   je     4011d2 <phase_6+0xde># 如果相等就跳d2
  4011cd:   48 89 d1                mov    %rdx,%rcx            
  4011d0:   eb eb                   jmp    4011bd <phase_6+0xc9># 跳转到bd处
```
可以看到这里其实就是把栈中的链表节点按照栈中的顺序连接起来！
```asm
  4011d2:   48 c7 42 08 00 00 00    movq   $0x0,0x8(%rdx)       # 给最后一个节点的指针域赋值为null
  4011d9:   00 
  4011da:   bd 05 00 00 00          mov    $0x5,%ebp            # 把0x5赋值为ebp
  4011df:   48 8b 43 08             mov    0x8(%rbx),%rax       # 将下一个节点的地址赋值给rax，因为在上一轮循环中rbx指向第一个链表元素
  4011e3:   8b 00                   mov    (%rax),%eax          # 访问节点的数据，并将数据复制给eax，注意这里只复制了低4个字节，从gdb中可以看到是有一串数字的
  4011e5:   39 03                   cmp    %eax,(%rbx)          # 比较eax和rbx，也就是说上一个节点和下一个节点比较
  4011e7:   7d 05                   jge    4011ee <phase_6+0xfa># 要让上一个节点的数据大于下一个节点的数据
  4011e9:   e8 4c 02 00 00          callq  40143a <explode_bomb># 否则就引爆
  4011ee:   48 8b 5b 08             mov    0x8(%rbx),%rbx       # 移动链表
  4011f2:   83 ed 01                sub    $0x1,%ebp            # 减去控制移动的东西，检查是否遍历完成
  4011f5:   75 e8                   jne    4011df <phase_6+0xeb>

  4011f7:   48 83 c4 50             add    $0x50,%rsp           # 恢复现场
  4011fb:   5b                      pop    %rbx
  4011fc:   5d                      pop    %rbp
  4011fd:   41 5c                   pop    %r12
  4011ff:   41 5d                   pop    %r13
  401201:   41 5e                   pop    %r14
  401203:   c3                      retq 
```  
先把最后一个节点的指针赋值为null，并通过ebp控制循环次数，检验链表前一个节点数据必须大于后一个节点数据！
所以根据gdb中的链表数据显示，在7减去数字之后的顺序应该是：`3 4 5 6 1 2`
也就是说初始数字应该是`4 3 2 1 6 5`
# 小结
看起来好像还有个secret phase，不过到此汇编应该就结束了，追求的也是能看懂，目前看简单的汇编也是没有问题了，bomb实验真的不错！之后有空再推进吧。

八股，爷来了！
# 参考
1. [老哥1](https://arthals.ink/posts/experience/bomb-lab)
2. [老哥2](https://www.viseator.com/2017/06/21/CS_APP_BombLab/#%E9%98%B6%E6%AE%B5%E4%B8%89)
3. [老哥3](https://wdxtub.com/csapp/thick-csapp-lab-2/2016/04/16/)