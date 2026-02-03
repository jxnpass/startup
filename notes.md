# CS 260 Notes

[My startup - Simon](https://simon.cs260.click)

## Helpful links

- [Course instruction](https://github.com/webprogramming260)
- [Canvas](https://byu.instructure.com)
- [MDN](https://developer.mozilla.org)

## AWS

<!--  My IP address is: 34.231.90.41 -->
Launching my AMI I initially put it on a private subnet. Even though it had a public IP address and the security group was right, I wasn't able to connect to it.

I can access the server files using  
```
ssh -i ~/pathtokey.pem ubuntu@bracketbuilder.click
```

Starting a AWS instance requires I do the following:
1. set up an instance 
2. create an elastic IP
3. set up a domain name / DNS
4. connect the domain name to the public IP address

These use the AWS apps EC2 and Route53

## Caddy

No problems worked just like it said in the [instruction](https://github.com/webprogramming260/.github/blob/main/profile/webServers/https/https.md).

Software allows for free private encryption. Should use Caddy in the future. 

## HTML

This was easy. I was careful to use the correct structural elements such as header, footer, main, nav, and form. The links between the various views work great using the `a` element. 

The "Create a Bracket Page" had the major parts of the HTML structure. Here I used a lot of those user options/interactive elements. These will create variables that build the bracket.

The list of brackets page and the bracket itself will require some extensive JavaScript code. Something that may be a struggle later. 


## CSS

The CSS was tough. Not a natural coder at that. But, from the first impression it looks like what I want it to: clean, easy to read, and interesting. 

Each HTML page has its own CSS formatting, where main.css is referenced, and then additional elements are carried into from the specific CSS file it references afterward. Bootstrap helped with missing pieces.

I will need to fix the bracket page a bit more to make it look exactly how I want it, but for now it will do for this assignment.


## React Part 1: Routing

Setting up Vite and React was pretty simple. I had a bit of trouble because of conflicting CSS. This isn't as straight forward as you would find with Svelte or Vue, but I made it work in the end. If there was a ton of CSS it would be a real problem. It sure was nice to have the code structured in a more usable way.

## React Part 2: Reactivity

This was a lot of fun to see it all come together. I had to keep remembering to use React state instead of just manipulating the DOM directly.

Handling the toggling of the checkboxes was particularly interesting.

```jsx
<div className="input-group sound-button-container">
  {calmSoundTypes.map((sound, index) => (
    <div key={index} className="form-check form-switch">
      <input
        className="form-check-input"
        type="checkbox"
        value={sound}
        id={sound}
        onChange={() => togglePlay(sound)}
        checked={selectedSounds.includes(sound)}
      ></input>
      <label className="form-check-label" htmlFor={sound}>
        {sound}
      </label>
    </div>
  ))}
</div>
```
