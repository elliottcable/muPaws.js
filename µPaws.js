#!/usr/bin/env node
                                                                                                            //|   Code over here, beyond column 111, is not intended for the consumption of casual readers.
(function(){ var Thing, Relation, Empty, Label, Execution, Native, Self, Expression, cPaws
 , fs   = require('fs')
 , path = require('path')
 , util = require('util')
   
 , paws = new Object()
   
                                                                                        paws.Thing =
   Thing = function(){
      this.receiver = /* super */                                                                           /*|*/ undefined
      this.metadata = [/* Relation */] }
   Thing.prototype.receiver = /* defined below */                                                           /*|*/ undefined
                                                                                     paws.Relation =
   Relation = function(to, responsible){
      this.to = to || undefined
      this.responsible = responsible || undefined }
                                                                                        paws.Empty =
   Empty = function(){              Thing.call(this) }                                 ;paws.Label =
   Label = function(string){        Thing.call(this)
      this.string = string || undefined }                                          ;paws.Execution =
   Execution = function(something){ Thing.call(this)
         this.pristine = true
      if (typeof something === 'function') {
         this.alien = true
         this.subs = Array.prototype.slice.call(arguments) }
      else {
         this.position = something || undefined
         this.stack = [] }
      
      this.locals = null }
   Execution.prototype.receiver = /* defined below */                                                       /*|*/ undefined
   
   Execution.prototype.
   complete = function(){
      if (this.alien) return !this.subs.length
      else            return typeof this.position === 'undefined' && this.stack.length === 0 }
   
   Execution.prototype.
   advance = function(rv) { var juxt, s
      if (this.complete()) return
      if (this.alien)    { this.pristine = false
                           return this.subs.splice(0, 1)[0] }
      
      if (!this.pristine) {
         if (typeof this.position === 'undefined') { 
            s = this.stack.pop()
            juxt = { context: this, left: s.value, right: rv }
            this.position = s.next
            return juxt } 
         else if (this.position.contents instanceof Expression) {
            this.stack.push({ value: rv, next: this.position.next })
            this.position = this.position.contents }
         else {
            juxt = { context: this, left: rv, right: this.position.contents }
            this.position = this.position.next
            return juxt } }
      
      this.pristine = false
      
      while (this.position.next && this.position.next.contents instanceof Expression) {
         this.stack.push({value: this.position.contents, next: this.position.next.next })
         this.position = this.position.next.contents }
      
      if (typeof this.position.next === 'undefined') {
         s = this.stack.pop()
         juxt = { context: this, left: s.value, right: this.position.contents }
         this.position = s.next
         return juxt }
      
      juxt = { context: this, left: this.position.contents, right: this.position.next.contents }
      this.position = this.position.next.next;
      return juxt
   }
   
   
   /* Parsing
   // ======= */                                                                   paws.Expression =
   Expression = function(contents, next){
      this.contents = contents || undefined
      this.next = next || undefined }
   
   Expression.prototype.
   append = function(next){ var pos = this
      while (pos.next) pos = pos.next
      pos.next = next }
                                                                                                            /*|*/ paws.cPaws = cPaws = new Object()
   cPaws.labelCharacters = /[^(){} ]/ // Not currently supporting quote-delimited labels
   
   cPaws.
   parse = function(text){ var i = 0
    , character = function(c){ return text[i] === c && ++i }
    , whitespace = function(){ while (character(' ')); return true }
    , braces = function(chars, constructor) {
         return function(){ var $
            if (whitespace() && character(chars[0]) && ($ = expr()) && whitespace() && character(chars[1]))
               return new constructor($)
            else return false } }
      
    , paren = braces('()', function(_){return _})
    , scope = braces('{}', Execution)
    , label = function(){ whitespace(); var $ = ''
         while ( text[i] && cPaws.labelCharacters.test(text[i]) )
            $ = $.concat(text[i++])
         return $ && new Label($) }
      
    , expr = function(){ var _, $ = new Expression()
         while (_ = paren() || scope() || label() )
            $.append(new Expression(_))
         return $ }
      
      return expr() }
   
   
   
   /* Interpretation
   // ============== */ var Mask, Stage, Staging, metadataReceiver, executionReceiver   ;paws.Mask =
   Mask = function(owner, roots){
      this.owner = owner || undefined
      this.roots = roots || [/* Thing */] }
   
   // Returns an array of all of the things that this `Mask`’s `roots` are responsible for.
   Mask.prototype.flatten = function(){
      return this.roots.reduce(function(acc, root){ var $$
         return ($$ = function(acc, it){ acc.push(it)
            return it.metadata.reduce(function(acc, relation){
               if (relation.responsible) acc.push(relation.to)
               return acc }, acc) })(acc, root) }, new Array()) }
   
   // Compare with a foreign mask for conflicting responsibility
   Mask.prototype.conflictsWith = function(far){ if (far === this) return false; far = far.flatten()
      return this.flatten().some(function(it){ return far.indexOf(it) !== -1 }) }
   
   // Ascertain if a foreign mask is a subset of this mask
   Mask.prototype.contains = function(far){ if (far === this) return true
      return far.flatten().intersect(this.flatten()).length === 0 }
                                                                                        paws.Stage =
   Stage = function(){
      this.occupant = undefined
      if (!Stage.default) Stage.default = this }
   
   // Non-concurrent implementation! Yay! </sarcasm>
   Stage.current = undefined
   Stage.default = undefined
   
   Stage.queue = [/* Staging */]
   Stage.queue.next = function(){
      // We look for the foremost element of the queue that either:
      // 1. isn’t already staged (inapplicable to this implementation),
      // 2. doesn’t have an associated `requestedMask`,
      // 3. is already responsible for a mask equivalent to the one requested,
      // 4. or whose requested mask doesn’t conflict with any existing ones, excluding its own
      for (var i = 0; i < Stage.queue.length; ++i) { var it = Stage.queue[i]
         alreadyResponsible = function(){
            return Stage.ownershipTable.masks
               .filter(function(mask, j){ return Stage.ownershipTable.blamees[j] === it.stagee })
                 .some(function(mask)   { return mask     .contains(it.requestedMask)          }) }
       , requestConflicts = function(){
            return Stage.ownershipTable.masks
               .filter(function(mask, j){ return Stage.ownershipTable.blamees[j] !== it.stagee })
                 .some(function(mask)   { return it.requestedMask.conflictsWith(mask)          }) }
         
       , canBeStaged = !it.requestedMask
                    ||  alreadyResponsible()
                    || !requestConflicts()
         
         if (canBeStaged)
            return Stage.queue.splice(i,1)[0] }}
      
                                                                                      paws.Staging =
   Staging = function(stagee, resumptionValue, requestedMask){
      this.stagee = stagee || undefined
      this.resumptionValue = resumptionValue || undefined
      this.requestedMask = requestedMask || undefined }
   
   Stage.ownershipTable = { blamees: [/* execution */]
                          , masks:   [/* Mask */] }
   Stage.ownershipTable.
   add = function(requestedMask){
      this.blamees.push(Stage.current.occupant)
      this.masks.push(requestedMask) }                                                                      /*|*/ ;Stage.ownershipTable.
   invalidate = function(execution){ var that = this
      that.blamees.forEach(function(blamee, i){
         if (blamee === execution) {
            that.blamees.splice(i,1)
            that.masks  .splice(i,1) } }) }
   
   Stage.prototype.realize = function(that){ var staging, resumptionValue, $$
                               that = that || this
      // Every call to `realize()` will result in *exactly one* execution being staged for
      // realization. Even if this `Stage` is already realizing, then the requested realization will
      // simply be deferred to the next tick. Thus, three immediate-sequential calls to `realize()`
      // will result in `realize()` executing three times on three subsequent ticks.
      if (Stage.current)
         return process.nextTick(function(){
            Stage.current = undefined // FIXME: I have no idea where this infinite loop is from.
            that.realize() })
      Stage.current = that
      
      if (!(
         staging = Stage.queue.next() )) return
      that.occupant = staging.stagee
      resumptionValue = staging.resumptionValue
      
      // We’ve already verified the requested mask’s availability, prior to accepting this
      // `Staging`, so no need to re-verify. If it’s defined, then we add it to the table.
      if (staging.requestedMask) Stage.ownershipTable.add(staging.requestedMask)
      
      ~function(){
         // Finally!
         // First, we handle the special-case of an alien Execution, and immediately return to
         // short-circuit handling of native executions;
         if (that.occupant.alien) {
            if (!that.occupant.complete())
                 that.occupant.advance()   .call(that.occupant, resumptionValue)
            return }
         
         // NYI: ... and then, failing that, proceed to handle native executions.
         ;($$ = function(resumptionValue){ var
            pair = that.occupant.advance(resumptionValue)
            // find juxtaposition handler
            // if alien, stack on an argument
            //    if has all arguments, call on-the-stack
            // if denizen, "call" pattern
            //    create staging
            //    (are we going to transfer ownerships for a call pattern?)
            //    queue staging
            //    unstage self
         } )(resumptionValue)
      }()
      
      if (that.occupant.complete())
         Stage.ownershipTable.invalidate(that.occupant)
      
      that.occupant = undefined
      Stage.current = undefined }
   //                                                                       Thing.prototype.receiver =
   //metadataReceiver = function(arguments){ var caller = arguments.get(1)
   // , LEFT = arguments.get(2)
   // , RIGHT = arguments.get(3)
   //   
   //   for (var i = LEFT.metadata.length - 1; i >= 0; --i) {
   //      if (LEFT.get(i).get(1) ===
   //   }
   //   }
                                                                      Execution.prototype.receiver =
   executionReceiver = function(){}
   
   Stage.prototype.
   intervalID = 0
   
   Stage.prototype.
   start = function(){
      if (!this.intervalID)
           this.intervalID = setInterval(this.realize, 50, this) }                                          /*|*/;Stage.prototype.
   stop  = function(){
      if ( this.intervalID)
           this.intervalID = clearInterval(this.intervalID) }
   
   /* Alien families
   // ============== */ var ǁ, infrastructure, neener_neener = {}, parseNum   ;paws.infrastructure =
   // FIXME: Much of the code here is a lie. This is a direct, on-the-stack JavaScript
   //        implementation, which Will Not Work™. Many of these aliens need do MSR or mutation, and
   //        thus need to charge and discharge things *themselves*, which means they (these aliens)
   //        need to propagate through the staging queue and whatnot. This is going to be complex ...
   // Then again, this is a non-concurrent implementation. Maybe that's fine? (Nope. Chuck Testa.)
   infrastructure = ǁ = {
           get: function(thing, number){ return thing.metadata[parseNum(number)].to }
    ,      set: function(thing, number, e){     thing.metadata[parseNum(number)] = new Relation(e) }
    ,    affix: function(thing, e){             thing.metadata.push(new Relation(e)) }
    ,  unaffix: function(thing){         return thing.metadata.pop().to }
    ,   prefix: function(thing, e){             thing.metadata.unshift(new Relation(e)) }
    , unprefix: function(thing){         return thing.metadata.shift().to }
    ,   remove: function(thing, number){ return thing.metadata.splice(parseNum(number), 1)[0].to }
      
    , clone: function(thing){ var metadata = thing.metadata
         thing = new Empty()
         thing.metadata = metadata.map(function(relation){
            return new Relation(relation.to, relation.responsible) })
         return thing }
    , adopt: function(thing, other){ thing.metadata = other.metadata.slice() } // IDFK: Utilizes identical `Relation`ships.
      // More note on the above: not sure how I’m going to define these semantics eventually, but
      // for the moment, the only sane way to call these if you don’t want weird behaviour where
      // changes to the responsibility-cascading grid affect unrelated objects, is to `clone()`
      // before `adopt()`ing.
      
    ,    receiver: function(thing){ return thing.receiver }
    , setReceiver: function(thing, receiver){
         if (!receiver || typeof receiver === 'function')
            receiver = new Execution(receiver)
         thing.receiver = receiver }
      
    ,    charge: function(thing, number){ thing.metadata[parseNum(number)].responsible = true }
    , discharge: function(thing, number){ thing.metadata[parseNum(number)].responsible = false }
      
    , compare: function(thing1, thing2){ return thing1 === thing2 } // FIXME: Currently a JavaScript boolean. Need Paws booleans.
      
    , label: {
         compare: function(label1, label2){ return label1.string === label2.string }
       ,   clone: function(label){ return new Label(label.string) } }
      
    , execution: {
         unstage: function(){ /* noop */ }
         // TODO: way to determine branch-ship
       , stage: function(_, execution, resumptionValue){
            Stage.queue.push(new Staging(execution, resumptionValue))
         ;( Stage.default ? Stage.default : new Stage() ).realize() }
         
       , branch: function(execution){ rv(/* NYI */) }
         
         // FIXME: Not exactly correct semantics, as this doesn't unstage the current execution.
       , charge: function(_, execution, thing){
            if (_ === execution) {
               Stage.queue.push(new Staging(execution, undefined, new Mask(execution, [thing])))
            ;( Stage.default ? Stage.default : new Stage() ).realize() }
            else {
               // FIXME: Needs to verify that the requested mask is a subgraph of the caller's,
               //           or ensure the mask is requested next time the execution is staged
               Stage.ownershipTable.add(new Mask(execution, [thing])) }}
         
      }
   }                                                                                                        /*|*/;paws.utilities = new Object()
                                                                           paws.utilities.parseNum =
   parseNum = function(number){
      if (number instanceof Label)     number = parseInt(number.string, 10)
      if (typeof number !== 'number'
      || isNaN(number))                number = 0
      return number }
   
   /* Plumbing
   // ======== */
   // Remove all common elements from a pair of `Array`s.
   // !! DESTRUCTIVELY MODIFIES ITS ARGUMENTS !!
   Array.prototype.intersect = function(them){ var that = this
      this.slice().forEach(function(e){ var kill, iA, iB
         if (that.indexOf(e) + them.indexOf(e) > -2) {
            that.deleteAll(e)
            them.deleteAll(e) } })
      return this }
   Array.prototype.union = function(){ /* NYI */ }
   Array.prototype.deleteAll = function(element){ var i
      while ((i = this.indexOf(element)) !== -1)
         delete this[i] }

if (require.main === module)
~function(){ var testing = new Object, Battery, Check, pending
 , red    = function($){ return "\033[37;41m"+$+"\033[0m" }
 , yellow = function($){ return "\033[33m"+$+"\033[0m" }
 , green  = function($){ return "\033[32m"+$+"\033[0m" }
   
   /* Testing-related plumbing
   // ======================== */                                                                                            /*
   // The following constructs a stupid little testing ‘framework,’ if one can even glorify it with
   // that name, that I then use to directly exercise several of the above tools.
   // Hacky as fuck? Yes.
   /* Effective? Also yes.                                                       */testing.Battery =
   Battery = function(battery){
      this.elements = new Array()
      if (this.ancestor = Battery.current)
          this.ancestor.elements.push(this)
                          Battery.current = this
                          battery.call()
                          Battery.current = this.ancestor }
   Battery.prototype.
   execute = function(n){ var n = n || 0
      stats = this.elements.reduce(function(acc, element){
         return testing.addStats(element.execute(n + 1), acc) }, Check.pristine)
      testing.log(n, testing.inspectStats(stats) )
      return stats }
                                                                                     testing.Check =
   Check = function(target){ var that = this
      if ( that.battery = Battery.current )
           that.battery.elements.push(that)
           that.target = target || undefined
           that.expectations = Array.prototype.splice.call(arguments, 1)
      return function(expectation){
           that.expectations.push(expectation)
      if (!that.battery )
           testing.log(0, testing.inspectStats(that.execute(expectation)))
         return arguments.callee } }
   
   Check.pristine = [0,0,0]                                                               ;pending =
   Check.pending = 'pending'
   
   Check.prototype.
   execute = function(n, expectation){ var
      target = this.target && this.target.call instanceof Function && this.target.length === 0 ?
                  this.target.call() : this.target
      return (expectation? [expectation] : this.expectations).reduce(function(acc, expectation){ var
         result = expectation.call(target, target)
         testing.log(n, (result === Check.pending? yellow : result? green : red)
                           (' '+expectation.toString().replace('function ','      ->')) )
         return testing.addStats(
            result === Check.pending? [0,1,0]
          : result?                   [1,0,0]
          :                           [0,0,1]
          , acc) }, Check.pristine) }
   
   testing.log = function(n, string, max){ max = max || 100; console.log(
      // This monstrosity splits a string into lines, and further splits any lines over `max`
      // characters (ignoring ANSI SGR escapes specifically) into multiple lines; then indents.
      string.split(new RegExp(
         '((?:(?:\033\\[[\\d;]+m)?[^\\n]){0,'+((max-2*n)-1)+'}(?=\\n|$)|(?:(?:\033\\[[\\d;]+m)?[^\\n]){'+(max-3*n)+'})' ))
      .filter(function(_, i){ return i % 2 }) .join("\n")
      .replace(/(^|\n)/g, '$1'+new Array(n+1).join('   ')) )}
   testing.inspectStats = function(s,p,f){ if (s instanceof Array) { f=s[2]; p=s[1]; s=s[0] }
      return (f? red : p? yellow : green)( (s+p) +' of '+ (s+p+f) )
           + (p? ' '+ yellow('('+ p + ' pending)') : '') }
   testing.addStats = function(a, b){ return [a[0]+b[0], a[1]+b[1], a[2]+b[2]] }
   
new Battery(function(){

/* Parsing tests
// ============= */
new Battery(function(){

var expr1 = new Expression, expr2 = new Expression, expr3 = new Expression
new Check()
(function(){        expr1  .append(expr2)
             return expr1.next === expr2 })
(function(){        expr1  .append(expr3)
             return expr1.next === expr2 })
(function(){ return expr1.next === expr2 })

new Check(  cPaws.parse('')  )
(function(locals){ return typeof locals.contents === 'undefined' })

var some_string = 'µPaws'
new Check(  cPaws.parse(some_string) .next  )
(function(label_node){ return label_node.contents instanceof Label })
(function(label_node){ return label_node.contents.string === some_string })

new Check(  cPaws.parse(some_string +' '+ some_string)  )
(function(root){ return root.next     .contents instanceof Label })
(function(root){ return root.next     .contents.string === some_string })
(function(root){ return root.next.next.contents instanceof Label })
(function(root){ return root.next.next.contents.string === some_string })

new Check(  cPaws.parse('('+ some_string +')')  )
(function(locals){ return typeof locals.contents === 'undefined' })
(function(node)  { return node.next instanceof Expression })
(function(node)  {           var inner_locals = node.next.contents
                   return typeof inner_locals.contents === 'undefined' })
(function(node)  {           var inner_locals = node.next.contents
                               , inner_label  = inner_locals.next
                          return inner_label.contents instanceof Label })

new Check(  cPaws.parse('{}') .next  )
(function(scope){ return scope.contents instanceof Execution })

var scope = cPaws.parse('{' + some_string + '}')
new Check(  scope .next .contents  )
(function(execution){ return !execution.complete() })


var execution = scope.next.contents
new Check(  execution .position  )
(function(locals){ return typeof locals.contents === 'undefined' })

new Check(  execution .position .next  )
(function(label_node){ return label_node.contents instanceof Label })
(function(label_node){ return label_node.contents.string === some_string })

})
/* Advancement tests
// ================= */
new Battery(function(){

var func1 = new Function(), func2 = new Function()
new Check(  new Execution(func1, func2)  )
(function(alien){ return  alien.pristine && !alien.complete() })
(function(alien){ return  alien.subs.length === 2 })

(function(alien){ return  alien.advance() === func1 })
(function(alien){ return !alien.pristine })
(function(alien){ return  alien.subs.length === 1 })

(function(alien){ return  alien.advance() === func2 })
(function(alien){ return  alien.complete() })

new Check(  new Execution(cPaws.parse(''))  )
(function(native){ return 'pending'; return  native.pristine })
(function(native){ return 'pending'; return  native.complete() })
(function(native){ return 'pending'; return typeof native.advance() === 'undefined' })

var some_string = 'µPaws'
~function(){
var  a_native = new Execution(cPaws.parse(some_string))
,      locals = a_native.position
,  some_label = locals.next.contents

new Check(  a_native  )
(function(native){ return  native.pristine
                       && !native.complete() })
(function(native){ var juxt = native.advance()
         return typeof juxt.left === 'undefined'
                    && juxt.right === some_label })
(function(native){ return !native.pristine
                       &&  native.complete() })
(function(native){ return typeof native.advance() === 'undefined' })
}()

~function(){
var      a_native = new Execution(cPaws.parse(some_string +' '+ some_string))
,          locals = a_native.position
,     first_label = locals.next.contents
,    second_label = locals.next.next.contents
, arbitrary_thing = new Thing()

new Check(  a_native  )
(function(native){ return  native.pristine
                       && !native.complete() })
(function(native){ var juxt = native.advance()
         return typeof juxt.left === 'undefined'
                    && juxt.right === first_label })
(function(native){ return !native.pristine })
(function(native){ var juxt = native.advance(arbitrary_thing)
                return juxt.left === arbitrary_thing
                    && juxt.right === second_label })
(function(native){ return  native.complete() })
(function(native){ return typeof native.advance() === 'undefined' })
}()

~function(){
var      a_native = new Execution(cPaws.parse('('+ some_string +')'))
,          locals = a_native.position
,    inner_locals =       locals.next.contents
,      some_label = inner_locals.next.contents
, arbitrary_thing = new Thing()

new Check(  a_native  )
(function(native){ return  native.pristine
                       && !native.complete() })
(function(native){ var juxt = native.advance()
         return typeof juxt.left === 'undefined'
                    && juxt.right === some_label })
(function(native){ return !native.pristine })
(function(native){ var juxt = native.advance(arbitrary_thing)
         return typeof juxt.left === 'undefined'
                    && juxt.right === arbitrary_thing })
(function(native){ return  native.complete() })
(function(native){ return typeof native.advance() === 'undefined' })
}()


})

}).execute() }()

if(module)module.exports=paws})()
