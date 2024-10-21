---
title: "C++: functional"
date: 2024-10-21T14:55:00+08:00
summary: 'function & bind'
categories: ['C++']
draft: false
images: ['/img/CPP/cpp11.png', '/img/CPP/cpp_logo.png']
---
# 1. 前言
在C中调用一个函数，要么直接用函数名，要么用函数指针，但函数指针玩一些骚操作的时候灵活性有限。而`function`和`bind`作为C++11的两个模板类，能够封装类似函数指针的`可调用对象`，提供一致的调用接口，比原生的函数指针要更加灵活，也减少了许多心智负担。
{{< fold-block "可调用对象" >}}
可调用对象：
* 普通函数
* 类成员函数
* 类静态函数
* 仿函数/函数对象
* lambda
* bind创建对象

这里分类并不十分精准，只是个人经验，更标准的分法是五种：
* 函数
* 函数指针
* lambda
* bind创建的对象
* 仿函数
{{< /fold-block >}}

两个模板类都在头文件`<functional>`中被定义。

# 2. 使用
## 2.1 普通函数
以add和sub两个函数为例：
```c++
int add(int x, int y) {
    return x + y;
}

int sub(int x, int y) {
    return x - y;
}

function<int(int, int)> func = add;
cout << func(1, 2) << endl; // 3

func = sub;
cout << func(1, 2) << endl; // -1
``` 

function模板在传入函数类型后就可以直接引用不同的函数，只要函数类型相同即可。

再比如回调函数：
```c++
int callback(function<int(int, int)> func, int x, int y) {
   return func(x, y);
}

cout << callback(add, 1, 2) << endl; // 3
```
bind则是起到绑定参数的作用，function配合bind则可以完成延迟调用。首先，bind的基本使用如下：
```c++
void print(const string& s1, const string& s2) {
    cout << s1 << " " << s2 << endl;
}

string s1{"hello"}, s2{"world"};

function<void()> f1 = bind(print, s1, s2);
f1(); // hello world
```
这里很有意思，bind把print的参数绑定了，所以function对象的模板参数是`void()`，而非print的函数类型。bind还可以只绑定部分参数：
```c++
string s3{"hi"};

function<void(const string&)> f2 = bind(print, placeholders::_1, s2);
f2(s3); // hi world
```
`placeholders::_1`则是一个占位符，表示该参数在调用时被决定。
这里也可以看出来，bind返回的可调用对象的确`“改变了函数的参数列表”`，也比较符合bind的字面意思：`绑定参数到可调用对象上`。

## 2.2 类成员函数
类成员函数则是需要一个`实例对象`才能调用（想想this），因此在使用bind包装时，要传入实例对象作为第一个参数。
```c++
class foo {
public:
    int add(int x, int y) {
        return x + y;
    }
    static int sub(int x, int y) {
        return x - y;
    }
};

foo foo1;
auto f3 = bind(&foo::add, foo1, 10, 20);
cout << f3() << endl; // 30
```
第一个参数仍然是函数地址，但不同的是多一个取地址符号，第二个参数则是实例对象。
foo1如果要以引用的方式传递的时候，或者说要更改foo1内部数据的时候，要以引用`(std::ref)`的方式传递。
类成员函数通过&来标明这是一个成员函数。

## 2.3 类静态函数
static函数属于类，所以无需对象也可调用，因此不用添加&。
```c++
auto f4 = bind(foo::sub, 10, 20);
cout << f4() << endl;  // -10
```
{{< notice notice-info >}}
bind对于预先绑定的参数是`pass-by-value`的，要传递引用则需要使用`std::ref`或者`std::cref`，前者是传引用，后者是传const引用。
{{< /notice >}}

```c++
void add1(int &a) {
    ++a;
}

int a = 1;
auto f5 = bind(add1, a);
f5();
cout << a << endl; // 1

auto f6 = bind(add1, ref(a));
f6();
cout << a << endl; // 2
```
用std::ref则是传递引用，std::ref返回一个包装好的引用对象`reference_wrapper`，能够转换成被引用值的引用类型（内部本质就是传地址的）

lambda和仿函数也是同理，无非是仿函数需要一个实例对象，此处不再赘述。
```c++
// lambda
function<bool(const int &)> f1 = [](const int &a) { return a; };
// 仿函数，这里的foo()是创建临时对象，而非调用函数
function<bool(const int &)> f2 = foo();
```
# 2.4 访问类的成员
例子来自cpp reference，感觉很奇怪：
```c++
#include <iostream>
#include <functional>

class Foo {
public:
    int num_;

    Foo(int num) : num_(num) {} // 构造函数初始化 num_
};

int main() {
    Foo foo(10);

    // 创建一个 std::function 对象 f_num，它可以接受 Foo 类型的引用并返回 int 类型的值
    // 这里 &Foo::num_ 是指向 Foo 类数据成员 num_ 的指针
    std::function<int(Foo const&)> f_num = &Foo::num_;

    // 通过传入 foo 对象的引用，使用 f_num 来获取 foo 对象的 num_ 成员变量的值
    std::cout << "num_: " << f_num(foo) << '\n'; // 输出：num_: 10

    return 0;
}

```
没想到居然还能访问数据成员。
# 3. 参考
1. https://www.bilibili.com/video/BV1bm41197XV/?spm_id_from=333.788&vd_source=71ee144274d993f1c946fc98badf272d
1. https://www.cnblogs.com/Philip-Tell-Truth/p/5814213.html
1. https://en.cppreference.com/w/cpp/utility/functional/function