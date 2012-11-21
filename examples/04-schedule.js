#!/usr/bin/env node
var paws = require('../µpaws')
  , util = require('util')

Object.keys(paws)
   .forEach(function(key){
      global[key] = paws[key] })

~function(){ var u
   
 , red   = function($){ return "\033[37;41m"+$+"\033[0m" }
 , green = function($){ return "\033[37;42m"+$+"\033[0m" }
   
   // The following is something like:
   //    
   //    arb = empty clone
   //    
   //    foo = { print ‘One,’
   //            charge  () (arb)
   //            unstage ()
   //            print ‘two,’
   //            charge  () (arb)
   //            unstage ()
   //            print ‘three!’ }
   //    
   //    bar = { print ‘Aeh,’
   //            charge  () (arb)
   //            unstage ()
   //            print ‘bee,’
   //            charge  () (arb)
   //            unstage ()
   //            print ‘cee!’ }
   //    
   //    stage (foo)
   //    stage (bar)
   //    
 , some_thing = new Empty()
 , some_child = new Empty()
   
 , greedy = new Execution(                                                             function(rv){
/*~*/ console.log("A.. some_thing") /*~*/
      infrastructure.execution .charge(this,this, some_thing)
      infrastructure.execution.unstage(this,this)                                    },function(rv){
/*~*/ console.log("A++ some_thing") /*~*/
      setTimeout(
         infrastructure.execution.stage
                               , 2500, this,this)
      infrastructure.execution.unstage(this,this)                                    },function(rv){
/*~*/ console.log("A-- some_thing") /*~*/
      infrastructure.execution.unstage(this,this)                                    } )
   
 , desirous = new Execution(                                                           function(rv){
/*~*/ console.log("B.. some_child") /*~*/
      infrastructure.execution .charge(this,this, some_child)
      infrastructure.execution.unstage(this,this)                                    },function(rv){
/*~*/ console.log("B++ some_child") /*~*/
      setTimeout(
         infrastructure.execution.stage
                               , 1500, this,this)
      infrastructure.execution.unstage(this,this)                                    },function(rv){
      
/*~*/ console.log("B-- some_child") /*~*/
      infrastructure.execution.unstage(this,this)                                    } )
   
   
   some_thing._id_ = 'some_thing'
   some_child._id_ = 'some_child'
   greedy._id_ = 'greedy'
   desirous._id_ = 'desirous'
   
   console.log("=== Let's go! ===")
   new Stage().start()
   
   infrastructure.set(some_thing, 1, some_child)
   infrastructure.charge(some_thing, 1)
   
   infrastructure.execution.stage(u,greedy)
   infrastructure.execution.stage(u,desirous)
   
}()