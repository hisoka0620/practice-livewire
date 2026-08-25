 <flux:modal name="error-notification" class="md:w-md">
     <div class="space-y-6">
         <div class="flex items-start gap-4">
             <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-950/30 text-red-400">
                 <flux:icon name="exclamation-triangle" class="size-5" />
             </div>

             <div class="space-y-2">
                 <flux:heading size="lg">
                     Operation failed
                 </flux:heading>

                 <flux:text x-text="errorMessage" class="text-zinc-400"></flux:text>
             </div>
         </div>

         <div class="flex justify-end">
             <flux:button variant="primary" x-on:click="$flux.modal('error-notification').close()">
                 Close
             </flux:button>
         </div>
     </div>
 </flux:modal>
