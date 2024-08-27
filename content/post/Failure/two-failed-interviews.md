---
title: "记两次失败的面试"
date: 2024-08-27T21:24:59+08:00
summary: '"优势在我"'
categories: ['Interview']
draft: false
images: ['/img/Failure/优势在我.png', '/img/Failure/joker0.gif']
---
{{< notice notice-warning >}}
记录沉痛的失败
{{< /notice >}}
# 1. Failure 1
今年4月找实习的时候被XX捞了，好不容易整到了二面，刁难人的智力题也回答来了，但倒在了手撕上：

1. 0-1背包问题
2. 腐烂的橘子
3. 大数乘法
4. 二叉树的右视图 

其实在这个时间点已经把hot100刷完了，还另外多刷了七八十道，想着手撕怎么也得`优势在我`，万万没想到tmd刷错了题单🤡。

我刷的是所有题目中的题单`LeetCode 热题 HOT 100`，实际上hot100指的是[LeetCode 热题 100](https://leetcode.cn/studyplan/top-100-liked/)，但这里的2. 4.两道手撕都只在后者里才有。

到这里已经暴露了两个问题：
1. 和一起找实习的人交流过少，连leetcode刷错了都不知道
2. 心理能力太差，二叉树的右视图不过是层序遍历取每一层的最后一个，当时太紧张没反应过来

但事后还没有仔细反省，整天乐乐呵呵的，于是就导致了第二次惨剧。

# 2. Failure 2
就在昨天，已经干到XX三面了，细细想来已经是第8次面XX了，没想到又倒在了手撕上：

1. 相邻数字合并打印
2. 快排递归改迭代
3. 序列化和反序列化N叉树
4. 大数乘法

前面两道磕磕绊绊倒是做出来了，第三道实在是不会（结束一查leetcode会员题，草），重点又是这该死的`大数乘法`。

人不能在一个地方跌倒两次，自在上一次失败后，我把大数乘法的解法狠狠刻在大脑，没想到这次正好被我碰上了，于是十分钟不到就自信地撕出来了，但面试官一句不能用vector又将我打入深渊......

大数乘法在leetcode里是叫`43. 字符串相乘`，题解中官方解法如下：
```c++
class Solution {
public:
    string multiply(string num1, string num2) {
        if (num1 == "0" || num2 == "0") {
            return "0";
        }
        int m = num1.size(), n = num2.size();
        auto ansArr = vector<int>(m + n);
        for (int i = m - 1; i >= 0; i--) {
            int x = num1.at(i) - '0';
            for (int j = n - 1; j >= 0; j--) {
                int y = num2.at(j) - '0';
                ansArr[i + j + 1] += x * y;
            }
        }
        for (int i = m + n - 1; i > 0; i--) {
            ansArr[i - 1] += ansArr[i] / 10;
            ansArr[i] %= 10;
        }
        int index = ansArr[0] == 0 ? 1 : 0;
        string ans;
        while (index < m + n) {
            ans.push_back(ansArr[index]);
            index++;
        }
        for (auto &c: ans) {
            c += '0';
        }
        return ans;
    }
};
```
思路非常清晰：
1. 从低位到高位依次相乘，将结果存在每一位应该在的位置，这里有个推论：第i位和第j位的乘积是在第i+j+1位
2. 这里由于是用vector<int>来存，不用在乘法过程中考虑进位，后面专门有个for循环来处理进位
3. 删除前导0，并收集结果

如此清晰易懂很难让人不学习，但忽略了`使用string也可以达到相同的效果`：
```c++
class Solution {
public:
    string multiply(string num1, string num2) {
        if(num1 == "0" || num2 == "0") {
            return "0";
        }

        int m = num1.size();
        int n = num2.size();
        
        string res(m + n, '0');

        for (int i = m - 1; i >= 0; --i) {
            int n1 = num1[i] - '0';
            for (int j = n - 1; j >= 0; --j) {
                int n2 = num2[j] - '0';
                int n3 = res[i + j + 1] - '0' + n1 * n2;
                res[i + j + 1] = n3 % 10 + '0';
                res[i + j] += n3 / 10;
            }
        }

        for (int i = 0; i < m + n; ++i) {
            if (res[i] != '0') return res.substr(i);
        }
        return "0";
    }
};
```
这里思路大体相同，这里唯一要注意的是`一个char类型本质上也是存的整数，所以可以处理超过10的进位`。

我太蠢了，以前当助教总因为别人不懂怎么把数字和字符相互转换扣别人的分，直到今天我才发现真正应该被扣分的人是我啊🤡。

出来混，迟早要还，这下不但面试G了，还得泡池子😭，草啊！