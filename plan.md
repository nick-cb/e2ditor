- We need to support 2 copy mode, plain text and formated text
- For example, with this html:
```html
<div id="45148cde-3a22-44ba-a715-f5be04ee43e0" contenteditable="true" class="w-full flex items-center h-6 bg-yellow-500">
    1234&nbsp;
    <div style="display: flex; align-items: center;">
     <div class="flex items-center">
       <div class="inline-option flex items-center">
         <div contenteditable="true" class="px-1 min-h-6 bg-green-200">option 1</div>
       </div>
       <div class="flex items-center">
         <div contenteditable="true" class="px-1 min-h-6 bg-green-200">option 2</div>
       </div>
     </div>
    </div>
</div>
```
We should support this:
    - plain text: 1234 option 1/option 2
    - formated text: 1234 (option 1/option 2)
But how do we know if a div is inline option?
    -> have a Map that map the dom node to the underline data structure
When we call the insertInlineOption
    -> create inline option and pass it into the InlineOption component
    -> the component will register the dom nodes to the map
Should we re-introduce `inlineChildren` property
    -> Well, we want to make use of BlockList so we will add inlineChildren to InlineOption,
    but for that only and not try to do much with it right now.
    -> We have to re-introduce `inlineChildren` because using `renderToString` won't
    run `ref`. That make sense, we render it to string and not a dom node.
We need to find a way to move the inline children from a block to another block and
have the `target` property update to the new `target`.
    -> It straight forward with non-text block as it has an element that we can attach
    `registerBlock` function to that will do this for us, but the text node doesn't
    have an element to do so.
    -> For text block, if we insert text using the dom node, then in the observer, we
    have to somehow find the position to insert the text block to
    -> If we insert using data structure, we have to somehow tell the observer not to
    create a new text block for this node
    -> What about we using both, insert exist text node to data structure and insert
    dom node to the dom, so that in the observer we will compare both node and find
    out that it is dupplicated to create new block?
        -> But that is when we control everything, what about user delete, cut, paste
        content?
            -> Delete: Handle delete manually
            -> Cut: Handle handle delete manually, handle cut manually
            -> Paste: Handle paste manually? What about dupplicate in the observer?
    -> We will have a `Map`, which will map from dom node to the represent node.

- Delete
    - Let the browser handle the delete on dom node itself, using the observer
