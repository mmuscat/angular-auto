import { Auto, Check, Subscribe, Unsubscribe } from "./auto";
import {
   ChangeDetectionStrategy,
   ChangeDetectorRef,
   Component,
   Injectable,
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {BehaviorSubject, Subject, Subscription} from "rxjs";
import createSpy = jasmine.createSpy;

describe("Auto", () => {
   beforeEach(() => {
      TestBed.configureTestingModule({
         providers: [
            {
               provide: ChangeDetectorRef,
               useValue: {
                  markForCheck: createSpy("markForCheck"),
               },
            },
         ],
      });
   });

   it("should decorate class", () => {
      @Auto()
      class MyComponent {}

      expect(MyComponent).toBeTruthy();
   });

   describe("Check", () => {
      it("should decorate", () => {
         @Auto()
         class MyComponent {
            @Check()
            count = 0;
         }
         expect(MyComponent).toBeTruthy();
      });

      it("should mark for check", () => {
         @Injectable({ providedIn: "root" })
         @Auto()
         class AutoTest {
            @Check()
            count = 0;
         }
         const test = TestBed.inject(AutoTest);
         const changeDetector = TestBed.inject(ChangeDetectorRef);

         test.count = 10;
         // @ts-expect-error
         test.ngDoCheck();

         expect(changeDetector.markForCheck).toHaveBeenCalledTimes(1);
      });
   });

   describe("Subscribe", () => {
      it("should decorate", () => {
         @Injectable({ providedIn: "root" })
         @Auto()
         class MyComponent {
            @Subscribe()
            count = new BehaviorSubject(0);
         }
         expect(MyComponent).toBeTruthy();
      });

      it("should subscribe", () => {
         @Injectable({ providedIn: "root" })
         @Auto()
         class AutoTest {
            @Subscribe()
            count = new BehaviorSubject(0);
         }
         const test = TestBed.inject(AutoTest);

         spyOn(test.count, "subscribe").and.callThrough();
         // @ts-expect-error
         test.ngDoCheck();

         expect(test.count.subscribe).toHaveBeenCalledTimes(1);
      });

      it("should switch subscriptions", () => {
         @Injectable({ providedIn: "root" })
         @Auto()
         class AutoTest {
            @Subscribe()
            count = new BehaviorSubject(0);
         }
         const test = TestBed.inject(AutoTest);
         const previous = test.count;

         // @ts-expect-error
         test.ngDoCheck();
         expect(previous.observers.length).toBe(1);

         test.count = new BehaviorSubject(0);
         spyOn(test.count, "subscribe").and.callThrough();
         // @ts-expect-error
         test.ngDoCheck();

         expect(previous.observers.length).toBe(0);
         expect(test.count.subscribe).toHaveBeenCalledTimes(1);
         expect(test.count.observers.length).toBe(1);
      });

      it("should mark for check", () => {
         @Injectable({ providedIn: "root" })
         @Auto()
         class AutoTest {
            @Subscribe()
            count = new BehaviorSubject(0);
         }
         const test = TestBed.inject(AutoTest);
         const changeDetector = TestBed.inject(ChangeDetectorRef);

         // @ts-expect-error
         test.ngDoCheck();
         expect(changeDetector.markForCheck).toHaveBeenCalledTimes(1);

         test.count.next(10);
         test.count.next(20);
         test.count.next(30);

         expect(changeDetector.markForCheck).toHaveBeenCalledTimes(4);
      });

      it("should unsubscribe", () => {
         @Injectable({ providedIn: "root" })
         @Auto()
         class AutoTest {
            @Subscribe()
            count = new BehaviorSubject(0);
         }
         const test = TestBed.inject(AutoTest);

         // @ts-expect-error
         test.ngDoCheck();
         expect(test.count.observers.length).toBe(1);

         TestBed.resetTestingModule();
         expect(test.count.observers.length).toBe(0);
      });
   });

   describe("Unsubscribe", () => {
      it("should decorate", () => {
         @Auto()
         class AutoTest {
            @Unsubscribe()
            count = new Subscription();
         }
         expect(AutoTest).toBeTruthy();
      });
      it("should dispose when destroyed", () => {
         @Injectable({ providedIn: "root" })
         @Auto()
         class AutoTest {
            @Unsubscribe()
            count = new Subject();
         }
         const autoTest = TestBed.inject(AutoTest);

         // @ts-expect-error
         autoTest.ngDoCheck();

         spyOn(autoTest.count, "complete");
         spyOn(autoTest.count, "unsubscribe");

         TestBed.resetTestingModule();

         expect(autoTest.count.complete).toHaveBeenCalledTimes(1);
         expect(autoTest.count.unsubscribe).toHaveBeenCalledTimes(1);
         expect(autoTest.count.complete).toHaveBeenCalledBefore(autoTest.count.unsubscribe)
      });
   });

   describe("Component", () => {
      it("should create", () => {
         @Auto()
         @Component({
            template: `{{ count }}`,
            changeDetection: ChangeDetectionStrategy.OnPush,
         })
         class MyComponent {
            @Check()
            count = 0;

            @Subscribe()
            count$ = new BehaviorSubject(0);

            @Unsubscribe()
            subscription = new Subscription();
         }
         TestBed.configureTestingModule({
            declarations: [MyComponent],
         });
         const fixture = TestBed.createComponent(MyComponent);
         const changeDetector =
            fixture.debugElement.injector.get(ChangeDetectorRef);
         spyOn(changeDetector, "markForCheck").and.callThrough();
         spyOn(fixture.componentInstance.count$, "subscribe").and.callThrough();
         spyOn(
            fixture.componentInstance.subscription,
            "unsubscribe"
         ).and.callThrough();
         fixture.detectChanges();
         fixture.componentInstance.count = 10;
         fixture.detectChanges();
         fixture.destroy();
         expect(
            fixture.componentInstance.count$.subscribe
         ).toHaveBeenCalledTimes(1);
         expect(
            fixture.componentInstance.subscription.unsubscribe
         ).toHaveBeenCalledTimes(1);
         expect(fixture.debugElement.nativeElement.innerText).toBe("10");
      });
   });
});