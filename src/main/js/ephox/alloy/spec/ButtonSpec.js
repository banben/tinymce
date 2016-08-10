define(
  'ephox.alloy.spec.ButtonSpec',

  [
    'ephox.alloy.api.SystemEvents',
    'ephox.alloy.construct.EventHandler',
    'ephox.boulder.api.FieldPresence',
    'ephox.boulder.api.FieldSchema',
    'ephox.boulder.api.Objects',
    'ephox.boulder.api.ValueSchema',
    'ephox.highway.Merger',
    'ephox.numerosity.api.JSON',
    'ephox.perhaps.Result'
  ],

  function (SystemEvents, EventHandler, FieldPresence, FieldSchema, Objects, ValueSchema, Merger, Json, Result) {
    // FIX: Move to boulder
    var isOneOf = function (candidates) {
      return function (value) {
        return candidates.indexOf(value) > -1 ? Result.value(value) : Result.error(value + ' is not ' +
          'one of known candidates: ' + Json.stringify(candidates, null, 2)
        );
      };
    };

    var schema = ValueSchema.objOf([
      FieldSchema.strict('action'),
      FieldSchema.field(
        'buttonType', 
        'buttonType', 
        FieldPresence.defaulted('text'),
        ValueSchema.valueOf(isOneOf([ 'text', 'button' ]))
      ),

      // Hard-coded text. I think I want to make something in boulder that is going to 
      // allow a only one of checker.
      FieldSchema.field('text', 'text', FieldPresence.asOption(), ValueSchema.anyValue()),
      // aria-label .. check with Mike
      FieldSchema.field('clazz', 'clazz', FieldPresence.asOption(), ValueSchema.anyValue())
    ]);

    var defaultDom = function (detail) {
      return {
        tag: 'button',
        classes: detail.clazz().getOr([ ]),
        innerHtml: detail.text().getOr(''),
        attributes: Objects.wrapAll([
          // { key: 'aria-label', value: detail['aria-label']() },
          { key: 'role', value: 'button' }
        ])
      };
    };

    

    var make = function (spec) {
      // Not sure about where these getOrDie statements are
      var detail = ValueSchema.asStruct('button.spec', schema, spec).getOrDie();

      var executeHandler = EventHandler.nu({
        run: function (component) {
          var action = detail.action();
          action(component);
        }
      });

      var clickHandler = EventHandler.nu({
        run: function (component) {
          var system = component.getSystem();
          system.triggerEvent(SystemEvents.execute(), component.element(), { });
        }
      });

      var events = Objects.wrapAll([
        { key: SystemEvents.execute(), value: executeHandler },
        { key: 'click', value: clickHandler }
      ]);

      return Merger.deepMerge(
        {
          dom: defaultDom(detail),
          events: events
        },

        spec, 

        {
          uiType: 'custom'
        }
      );
    };

    return {
      make: make
    };
  }
);