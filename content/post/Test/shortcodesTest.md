---
title: "短代码测试"
date: 1970-01-01T21:47:11+08:00
summary: "测试"
# tags: ['/img/test/下载.png']
# heroimage: '/img/test/下载.png'
images: ['/img/test/google.png', '/img/test/google.png']
categories: ['Test']
---
# 1. 画廊效果的两种实现
## 1.1 实现1
{{< galleries >}}

{{< gallery src="/img/test/google.png" title="Google" >}}
{{< gallery src="/img/6.S081/kmemmap.png" >}}
{{< gallery src="/img/6.S081/6.S081.png" >}}
{{< gallery src="/img/6.S081/mit.png" >}}
{{< gallery src="/img/6.S081/pagetable.png" >}}
{{< gallery src="/img/6.S081/syscall.png" >}}

{{< /galleries >}}
## 1.2 实现2

{{< gallery2 "img/6.S081">}}
# 2. 豆瓣卡片
支持neodb和原生豆瓣
## 2.1 neodb
{{< neodb "https://neodb.social/book/5SJvkuHNGL4XhBddW2J4EJ" >}}
## 2.2 原生豆瓣
{{< neodb "https://book.douban.com/subject/36328704/" >}}
# 3. spotify
{{< spotify type="track" id="2D3gvohUyOfXIVX6Mvhqae" height="80px">}}
# 4. 图片轮播
{{< imgloop "/img/6.S081/kmemmap.png,/img/6.S081/kmemmap.png,/img/6.S081/kmemmap.png" >}}
# 5. 站内链接
{{< innerlink src="/post/OS/6.S081-Lab.md" >}} 
# 6. ppt/pdf
{{< ppt src="/pdf/A complete guide to Linux.pdf" >}}
# 7. bilibili
{{< bilibili BV1sz4y197L8 >}}
# 8. youtube
{{< youtube ghjOS7Q82s0 >}}
# 9. 文字排版
{{< align left "文字居左" >}}

{{< align center "文字居中" >}}

{{< align right "文字居右" >}}
# 10. quote

{{< notice notice-warning >}}
十里青山远，潮平路带沙。数声啼鸟怨年华。又是凄凉时候，在天涯。白露收残月，清风散晓霞。绿杨堤畔问荷花。记得年时沽酒，那人家。
{{< /notice >}}


{{< notice notice-info >}}
十里青山远，潮平路带沙。数声啼鸟怨年华。又是凄凉时候，在天涯。白露收残月，清风散晓霞。绿杨堤畔问荷花。记得年时沽酒，那人家。
{{< /notice >}}


{{< notice notice-note >}}
十里青山远，潮平路带沙。数声啼鸟怨年华。又是凄凉时候，在天涯。白露收残月，清风散晓霞。绿杨堤畔问荷花。记得年时沽酒，那人家。
{{< /notice >}}


{{< notice notice-tip >}}
十里青山远，潮平路带沙。数声啼鸟怨年华。又是凄凉时候，在天涯。白露收残月，清风散晓霞。绿杨堤畔问荷花。记得年时沽酒，那人家。
{{< /notice >}}

{{< simple-notice simple-notice-warning >}}
十里青山远，潮平路带沙。数声啼鸟怨年华。又是凄凉时候，在天涯。白露收残月，清风散晓霞。绿杨堤畔问荷花。记得年时沽酒，那人家。
{{< /simple-notice >}}

{{< simple-notice simple-notice-info >}}
十里青山远，潮平路带沙。数声啼鸟怨年华。又是凄凉时候，在天涯。白露收残月，清风散晓霞。绿杨堤畔问荷花。记得年时沽酒，那人家。
{{< /simple-notice >}}

{{< simple-notice simple-notice-note >}}
十里青山远，潮平路带沙。数声啼鸟怨年华。又是凄凉时候，在天涯。白露收残月，清风散晓霞。绿杨堤畔问荷花。记得年时沽酒，那人家。
{{< /simple-notice >}}

{{< simple-notice simple-notice-tip >}}
十里青山远，潮平路带沙。数声啼鸟怨年华。又是凄凉时候，在天涯。白露收残月，清风散晓霞。绿杨堤畔问荷花。记得年时沽酒，那人家。
{{< /simple-notice >}}

😂😎🎨🥪🛴💥

{{< quote >}}
十里青山远，潮平路带沙。数声啼鸟怨年华。又是凄凉时候，在天涯。白露收残月，清风散晓霞。绿杨堤畔问荷花。记得年时沽酒，那人家。
{{< /quote >}}


{{< quote en >}}
To see a world in a grain of sand. And a heaven in a wild flower. Hold infinity in the palm of your hand. And eternity in an hour.
{{< /quote >}}

{{< quote-center >}}
十里青山远，潮平路带沙<br>数声啼鸟怨年华<br>又是凄凉时候，在天涯<br>白露收残月，清风散晓霞<br>绿杨堤畔问荷花<br>记得年时沽酒，那人家
{{< /quote-center >}}

# 11. 折叠

{{< detail "折叠测试1" >}}
```c
printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");printf("123");
printf("123");
printf("123");
printf("123");
```
{{< /detail >}}

{{< fold-block "折叠测试2" >}}

~~这是折叠的内容～~~

***这是折叠的内容～***

**同样是MD文档，不受影响**

{{< /fold-block >}}

# 12. 图片排版
![](/img/author/head.jpg)


![](/img/author/head.jpg)
![](/img/author/head.jpg)


![](/img/author/head.jpg)
![](/img/author/head.jpg)
![](/img/author/head.jpg)


![](/img/author/head.jpg)
![](/img/author/head.jpg)
![](/img/author/head.jpg)
![](/img/author/head.jpg)

# 13. 分割线
{{< divider "END" >}}
{{< divider "End" >}}
{{< divider "end" >}}
{{< divider "描述文字" >}}
{{< divider "不是end则显示普通文字" >}}


# 参考
[老哥1](https://lovir.cn/p/shortcodes/)

[老哥2](https://www.sleepymoon.cyou/2023/hugo-shortcodes/)

[老哥3](https://ponder.lol/2023/hugo-shortcuts/)

[老哥4](https://innerso.prvcy.page/posts/shortcode-test/#%E5%8F%82%E8%80%83%E6%9D%A5%E6%BA%90)

[老哥5](https://www.sulvblog.cn/posts/blog/shortcodes/#64-%e5%8d%9a%e5%ae%a2%e6%96%87%e7%ab%a0%e5%86%85%e9%93%be)

[老哥6](https://immmmm.com/archives/)

[老哥7](https://wdh.hk/docs/short-code/)